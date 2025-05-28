import { useEffect, useState, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import type { ExternalProvider } from '@ethersproject/providers';
import { api } from '../utils/api';
import { formatDate } from '../utils/formatters';
import wallyv1DashAbi from '../abis/wallyv1DashAbi';
import dotenv from 'dotenv';
dotenv.config();

export type EventItem = {
    type: string;
    data: string;
    timestamp: string;
};

type BackendEvent = {
    type: string;
    data: string;
    timestamp: string | Date;
};

const useEvents = () => {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const contractRef = useRef<ethers.Contract | null>(null);
    const listenersRef = useRef<any[]>([]);

    const subscribeToEvents = useCallback(async () => {
        setLoading(true);
        let cancelled = false;

        // On-chain
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum as ExternalProvider);
            const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
            if (!contractAddress) {
                throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS is not defined');
            }
            const contract = new ethers.Contract(
                contractAddress,
                wallyv1DashAbi,
                provider
            );
            contractRef.current = contract;
            // Listen for minimal ABI events
            const eventNames = [
                'MiniAppSessionGranted',
                'MiniAppSessionRevoked',
                'PermissionGranted',
                'PermissionRevoked',
            ];
            eventNames.forEach(eventName => {
                const listener = (...args: any[]) => {
                    setEvents(prev => [
                        ...prev,
                        {
                            type: eventName,
                            data: JSON.stringify(args.slice(0, -1)),
                            timestamp: formatDate(new Date())
                        }
                    ]);
                };
                contract.on(eventName, listener);
                listenersRef.current.push({ eventName, listener });
            });
        }

        // Backend events
        try {
            const response = await api.get('/events');
            if (!cancelled) {
                setEvents(response.data.map((ev: BackendEvent) => ({
                    ...ev,
                    timestamp: formatDate(ev.timestamp)
                })));
            }
        } catch (error) {
            // handle error
        } finally {
            setLoading(false);
        }
        // Cleanup listeners
        if (contractRef.current && listenersRef.current.length) {
            listenersRef.current.forEach(({ eventName, listener }) => {
                if (contractRef.current) {
                    contractRef.current.off(eventName, listener);
                }
            });
            listenersRef.current = [];
        }
    }, []);

    useEffect(() => {
        subscribeToEvents();
        // Cleanup handled in subscribeToEvents
    }, [subscribeToEvents]);

    return { events, loading, subscribeToEvents };
};

export { useEvents };
export default useEvents;