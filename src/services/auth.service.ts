/**
 * ============================================================================
 *  Auth Service — handles COMPTE & CLIENT tables (Supabase)
 * ============================================================================
 *  Custom auth model: login/signup against the COMPTE table, session stored
 *  in localStorage. Admin check based on role_compte column.
 * ============================================================================
 */
import { supabase } from "../lib/supabase";
import type { AuthUser, Client, Compte } from "../lib/types";

const SESSION_KEY = "verhojust_session";

interface CompteRow {
  id_compte: number;
  id_client: number;
  login_compte: string;
  mot_de_passe_compte: string;
  role_compte: "admin" | "client";
  date_creation_compte: string;
}

interface ClientRow {
  id_client: number;
  nom_client: string;
  prenom_client: string;
  telephone_client: string;
  email_client: string;
  adresse_client: string;
  ville_client: string;
  date_inscription: string;
}

function mapCompte(row: CompteRow): Compte {
  return {
    idCompte: row.id_compte,
    idClient: row.id_client,
    loginCompte: row.login_compte,
    motDePasseCompte: row.mot_de_passe_compte,
    roleCompte: row.role_compte,
    dateCreationCompte: row.date_creation_compte,
  };
}

function mapClient(row: ClientRow): Client {
  return {
    idClient: row.id_client,
    nomClient: row.nom_client,
    prenomClient: row.prenom_client,
    telephoneClient: row.telephone_client,
    emailClient: row.email_client,
    adresseClient: row.adresse_client,
    villeClient: row.ville_client,
    dateInscription: row.date_inscription,
  };
}

export const authService = {
  async login(login: string, motDePasse: string): Promise<AuthUser> {
    const { data: compteRow, error } = await supabase
      .from("compte")
      .select("*")
      .eq("login_compte", login)
      .eq("mot_de_passe_compte", motDePasse)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!compteRow) throw new Error("Identifiants incorrects");

    const compte = mapCompte(compteRow as CompteRow);

    const { data: clientRow, error: clientError } = await supabase
      .from("client")
      .select("*")
      .eq("id_client", compte.idClient)
      .maybeSingle();
    if (clientError) throw new Error(clientError.message);
    if (!clientRow) throw new Error("Compte sans client associé");

    const client = mapClient(clientRow as ClientRow);
    const user: AuthUser = { compte, client };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
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
    const { data: existing } = await supabase
      .from("compte")
      .select("id_compte")
      .eq("login_compte", data.emailClient)
      .maybeSingle();
    if (existing) throw new Error("Un compte existe déjà avec cet email");

    const { data: clientRow, error: clientError } = await supabase
      .from("client")
      .insert({
        nom_client: data.nomClient,
        prenom_client: data.prenomClient,
        email_client: data.emailClient,
        telephone_client: data.telephoneClient,
        adresse_client: data.adresseClient,
        ville_client: data.villeClient,
      })
      .select("*")
      .single();
    if (clientError) throw new Error(clientError.message);
    const client = mapClient(clientRow as ClientRow);

    const { data: compteRow, error: compteError } = await supabase
      .from("compte")
      .insert({
        id_client: client.idClient,
        login_compte: data.emailClient,
        mot_de_passe_compte: data.motDePasse,
        role_compte: "client",
      })
      .select("*")
      .single();
    if (compteError) throw new Error(compteError.message);
    const compte = mapCompte(compteRow as CompteRow);

    const user: AuthUser = { compte, client };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
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

  async getAllClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from("client")
      .select("*")
      .order("id_client");
    if (error) throw new Error(error.message);
    return (data as ClientRow[]).map(mapClient);
  },
};
