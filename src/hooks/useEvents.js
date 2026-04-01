import { useState, useEffect } from 'react';
// import api from '../services/api'; // Ippo dummy data use panrom, future-la idha un-comment pannalam

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dummy Data Simulation
    setTimeout(() => {
      setEvents([
        { id: 1, title: 'Mega Job Fair - St. Joseph College', district: 'Trichy', location: 'Chathiram Bus Stand', date: 'April 10', type: 'Walk-in' },
        { id: 2, title: 'Tech Talent Drive 2026', district: 'Chennai', location: 'TIDEL Park', date: 'April 12', type: 'Off-Campus' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return { events, loading };
};