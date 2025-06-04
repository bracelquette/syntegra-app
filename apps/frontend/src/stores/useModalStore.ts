import { create } from "zustand";

interface ModalStore {
  // Create User Modal
  isCreateUserModalOpen: boolean;
  openCreateUserModal: () => void;
  closeCreateUserModal: () => void;

  // Edit User Modal
  isEditUserModalOpen: boolean;
  editUserId: string | null;
  openEditUserModal: (userId: string) => void;
  closeEditUserModal: () => void;

  // Delete User Modal
  isDeleteUserModalOpen: boolean;
  deleteUserId: string | null;
  openDeleteUserModal: (userId: string) => void;
  closeDeleteUserModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  // Create User Modal
  isCreateUserModalOpen: false,
  openCreateUserModal: () => set({ isCreateUserModalOpen: true }),
  closeCreateUserModal: () => set({ isCreateUserModalOpen: false }),

  // Edit User Modal
  isEditUserModalOpen: false,
  editUserId: null,
  openEditUserModal: (userId) =>
    set({ isEditUserModalOpen: true, editUserId: userId }),
  closeEditUserModal: () =>
    set({ isEditUserModalOpen: false, editUserId: null }),

  // Delete User Modal
  isDeleteUserModalOpen: false,
  deleteUserId: null,
  openDeleteUserModal: (userId) =>
    set({ isDeleteUserModalOpen: true, deleteUserId: userId }),
  closeDeleteUserModal: () =>
    set({ isDeleteUserModalOpen: false, deleteUserId: null }),
}));
