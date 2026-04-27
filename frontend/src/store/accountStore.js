// frontend/src/store/accountStore.js
import { create } from 'zustand';
import { accountService } from '../services/auth';

export const useAccountStore = create((set) => ({
  accounts: [],
  selectedAccount: null,
  transactions: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true });
    try {
      const data = await accountService.getAccounts();
      set({ accounts: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchTransactions: async (accountId) => {
    set({ isLoading: true });
    try {
      const data = await accountService.getTransactions(accountId);
      set({ transactions: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  transfer: async (transferData) => {
    set({ isLoading: true });
    try {
      await accountService.transfer(transferData);
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));