import { create } from "zustand";
import {
  MostrarCuentasPorCobrar,
  AbonarCuentaPorCobrar,
} from "../supabase/crudCuentasPorCobrar";

export const useCuentasPorCobrarStore = create((set) => ({
  dataCuentasPorCobrar: [],

  mostrarCuentasPorCobrar: async (p) => {
    const response = await MostrarCuentasPorCobrar(p);
    set({ dataCuentasPorCobrar: response });
    return response;
  },

  abonarCuentaPorCobrar: async (p) => {
    await AbonarCuentaPorCobrar(p);
  },
}));