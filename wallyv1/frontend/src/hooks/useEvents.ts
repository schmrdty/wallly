import { useEffect, useState, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import type { ExternalProvider } from '@ethersproject/providers';
import { api } from '../utils/api';
import { formatDate } from '../utils/formatters';
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
    const filterRef = useRef<ethers.EventFilter | null>(null);

    const subscribeToEvents = useCallback(async () => {
        setLoading(true);
        let cancelled = false;

        // On-chain
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum as ExternalProvider); // <-- Fix here
            const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
            if (!contractAddress) {
                throw new Error('REACT_APP_CONTRACT_ADDRESS is not defined');
            }
            const contract = new ethers.Contract(
                contractAddress,
                [
                    "event Transfer(address indexed from, address indexed to, uint256 value)",
                    // ...other events
                ],
                provider
            );
            contractRef.current = contract;
            const filter = contract.filters.Transfer();
            filterRef.current = filter;
            const transferListener = (from: string, to: string, value: any, event: any) => {
                setEvents(prev => [
                    ...prev,
                    {
                        type: 'Transfer',
                        data: `from: ${from}, to: ${to}, value: ${value.toString()}`,
                        timestamp: formatDate(new Date())
                    }
                ]);
            };
            contract.on(filter, transferListener);
            // Store the listener for cleanup
            (contractRef.current as any)._transferListener = transferListener;
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
        if (contractRef.current && filterRef.current && (contractRef.current as any)._transferListener) {
            contractRef.current.off(filterRef.current, (contractRef.current as any)._transferListener);
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