import { useEffect, useState, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import { api } from '../utils/api';
import { formatDate } from '../utils/formatters';

const useEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const contractRef = useRef(null);
    const filterRef = useRef(null);

    const subscribeToEvents = useCallback(async () => {
        setLoading(true);
        let cancelled = false;

        // On-chain
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(
                process.env.REACT_APP_CONTRACT_ADDRESS,
                [
                    "event Transfer(address indexed from, address indexed to, uint256 value)",
                    // ...other events
                ],
                provider
            );
            contractRef.current = contract;
            const filter = contract.filters.Transfer();
            filterRef.current = filter;
            contract.on(filter, (from, to, value, event) => {
                setEvents(prev => [
                    ...prev,
                    {
                        type: 'Transfer',
                        data: `from: ${from}, to: ${to}, value: ${value.toString()}`,
                        timestamp: formatDate(new Date())
                    }
                ]);
            });
        }

        // Backend events
        try {
            const response = await api.get('/events');
            if (!cancelled) {
                setEvents(response.data.map(ev => ({
                    ...ev,
                    timestamp: formatDate(ev.timestamp)
                })));
            }
        } catch (error) {
            // handle error
        } finally {
            setLoading(false);
        }

        return () => {
            cancelled = true;
            if (contractRef.current && filterRef.current) {
                contractRef.current.off(filterRef.current);
            }
        };
    }, []);

    useEffect(() => {
        subscribeToEvents();
        // Cleanup handled in subscribeToEvents
    }, [subscribeToEvents]);

    return { events, loading, subscribeToEvents };
};

export { useEvents };
export default useEvents;