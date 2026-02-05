import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useAgent(agentAddress) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!agentAddress) return;

    const fetchStatus = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/agents/${agentAddress}`);
        if (!res.ok) throw new Error('Failed to fetch agent status');
        const data = await res.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    // Refresh every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [agentAddress]);

  return { status, loading, error };
}

export function useTiers() {
  const [tiers, setTiers] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTiers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/tiers`);
        const data = await res.json();
        setTiers(data.tiers);
      } catch (err) {
        console.error('Error fetching tiers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTiers();
  }, []);

  return { tiers, loading };
}

export function useTasks(agentAddress, tier) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agentAddress) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (agentAddress) query.append('agent', agentAddress);
        if (tier) query.append('tier', tier);

        const res = await fetch(`${API_URL}/tasks?${query}`);
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (err) {
        console.error('Error fetching tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [agentAddress, tier]);

  return { tasks, loading };
}
