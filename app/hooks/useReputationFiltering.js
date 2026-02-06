import { useState, useCallback } from 'react';
import useMarketplaceContract from './useMarketplaceContract';

export const useReputationFiltering = () => {
  const {
    getVerifiedFeedback,
    getTasksCompleted,
    getReputationSummary,
  } = useMarketplaceContract();

  const [reputationData, setReputationData] = useState(null);
  const [userTasksCompleted, setUserTasksCompleted] = useState(0);
  const [userIsVerified, setUserIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFilteredReputation = useCallback(
    async (agentAddress) => {
      setIsLoading(true);
      setError(null);

      try {
        const verifiedFeedback = await getVerifiedFeedback(agentAddress);
        const summary = await getReputationSummary(agentAddress);

        setReputationData({
          agentAddress,
          feedback: verifiedFeedback,
          summary: summary,
          verifiedHirersCount: verifiedFeedback.length,
          totalFeedback: verifiedFeedback.length,
          isFiltered: true,
          filterDescription: 'Reputation filtered by verified marketplace participants',
        });

        return {
          feedback: verifiedFeedback,
          summary: summary,
          verifiedHirersCount: verifiedFeedback.length,
        };
      } catch (err) {
        const errorMsg = err.message || 'Failed to fetch reputation data';
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getVerifiedFeedback, getReputationSummary]
  );

  const fetchUserTaskStatus = useCallback(async () => {
    try {
      const tasksCompleted = await getTasksCompleted();
      const verified = tasksCompleted >= 3;

      setUserTasksCompleted(tasksCompleted);
      setUserIsVerified(verified);

      return {
        tasksCompleted,
        isVerified: verified,
        tasksRemaining: Math.max(0, 3 - tasksCompleted),
        progressPercent: Math.min(100, (tasksCompleted / 3) * 100),
      };
    } catch (err) {
      console.error('Error fetching user task status:', err);
      return {
        tasksCompleted: 0,
        isVerified: false,
        tasksRemaining: 3,
        progressPercent: 0,
      };
    }
  }, [getTasksCompleted]);

  return {
    reputationData,
    userTasksCompleted,
    userIsVerified,
    isLoading,
    error,
    fetchFilteredReputation,
    fetchUserTaskStatus,
  };
};

export default useReputationFiltering;
