/**
 * ============================================================================
 *  Auth Service — handles COMPTE & CLIENT tables
 *  ============================================================================
 *  Sign up, sign in, session management, role-based access control.
 *  In mock mode, credentials are checked in-memory. When the Express API is
 *  live, these calls hit `/auth/*` endpoints backed by the MySQL database.
 * ============================================================================
 */
import { isMock, http } from "../lib/api";
import {
  clients,
  comptes,
  counters,
  mockRequest,
  formatDate,
} from "../lib/mockData";
import type { AuthUser, Compte, Client } from "../lib/types";

const SESSION_KEY = "verhojust_session";

export const authService = {
  async login(login: string, motDePasse: string): Promise<AuthUser> {
    if (!isMock) return http.post<AuthUser>("/auth/login", { login, motDePasse });

    const compte = comptes.find(
      (c) => c.loginCompte === login && c.motDePasseCompte === motDePasse
    );
    if (!compte) throw new Error("Identifiants incorrects");
    const client = clients.find((c) => c.idClient === compte.idClient);
    if (!client) throw new Error("Compte sans client associé");
    const user: AuthUser = { compte, client };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return mockRequest(user);
  },

  async signup(data: {
    nomClient: string;
    prenomClient: string;
    emailClient: string;
    telephoneClient: string;
    adresseClient: string;
    villeClient: string;
    motDePasse: string;
  }): Promise<AuthUser> {
    if (!isMock) return http.post<AuthUser>("/auth/signup", data);

    if (comptes.some((c) => c.loginCompte === data.emailClient)) {
      throw new Error("Un compte existe déjà avec cet email");
    }

    const idClient = counters.client++;
    const idCompte = counters.compte++;
    const now = formatDate(new Date());

    const client: Client = {
      idClient,
      nomClient: data.nomClient,
      prenomClient: data.prenomClient,
      telephoneClient: data.telephoneClient,
      emailClient: data.emailClient,
      adresseClient: data.adresseClient,
      villeClient: data.villeClient,
      dateInscription: now.slice(0, 10),
    };
    const compte: Compte = {
      idCompte,
      idClient,
      loginCompte: data.emailClient,
      motDePasseCompte: data.motDePasse,
      roleCompte: "client",
      dateCreationCompte: now.slice(0, 10),
    };
    clients.push(client);
    comptes.push(compte);

    const user: AuthUser = { compte, client };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return mockRequest(user);
  },

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession(): AuthUser | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  isAdmin(user: AuthUser | null): boolean {
    return user?.compte.roleCompte === "admin";
  },
};
