export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      actualites: {
        Row: {
          auteur_id: string | null
          cible: Database["public"]["Enums"]["role_utilisateur"] | null
          contenu: string
          created_at: string
          etablissement_id: string
          id: string
          titre: string
        }
        Insert: {
          auteur_id?: string | null
          cible?: Database["public"]["Enums"]["role_utilisateur"] | null
          contenu: string
          created_at?: string
          etablissement_id: string
          id?: string
          titre: string
        }
        Update: {
          auteur_id?: string | null
          cible?: Database["public"]["Enums"]["role_utilisateur"] | null
          contenu?: string
          created_at?: string
          etablissement_id?: string
          id?: string
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "actualites_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actualites_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      affectations: {
        Row: {
          id: string
          matiere_classe_id: string
          professeur_id: string
        }
        Insert: {
          id?: string
          matiere_classe_id: string
          professeur_id: string
        }
        Update: {
          id?: string
          matiere_classe_id?: string
          professeur_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affectations_matiere_classe_id_fkey"
            columns: ["matiere_classe_id"]
            isOneToOne: false
            referencedRelation: "matiere_classe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affectations_matiere_classe_id_fkey"
            columns: ["matiere_classe_id"]
            isOneToOne: false
            referencedRelation: "v_bulletin"
            referencedColumns: ["matiere_classe_id"]
          },
          {
            foreignKeyName: "affectations_professeur_id_fkey"
            columns: ["professeur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      annees_scolaires: {
        Row: {
          date_debut: string
          date_fin: string
          est_active: boolean
          etablissement_id: string
          id: string
          libelle: string
        }
        Insert: {
          date_debut: string
          date_fin: string
          est_active?: boolean
          etablissement_id: string
          id?: string
          libelle: string
        }
        Update: {
          date_debut?: string
          date_fin?: string
          est_active?: boolean
          etablissement_id?: string
          id?: string
          libelle?: string
        }
        Relationships: [
          {
            foreignKeyName: "annees_scolaires_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      cahier_texte: {
        Row: {
          contenu_seance: string | null
          created_at: string
          date_echeance: string | null
          date_seance: string
          id: string
          matiere_classe_id: string
          professeur_id: string | null
          travail_a_faire: string | null
          updated_at: string
        }
        Insert: {
          contenu_seance?: string | null
          created_at?: string
          date_echeance?: string | null
          date_seance: string
          id?: string
          matiere_classe_id: string
          professeur_id?: string | null
          travail_a_faire?: string | null
          updated_at?: string
        }
        Update: {
          contenu_seance?: string | null
          created_at?: string
          date_echeance?: string | null
          date_seance?: string
          id?: string
          matiere_classe_id?: string
          professeur_id?: string | null
          travail_a_faire?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cahier_texte_matiere_classe_id_fkey"
            columns: ["matiere_classe_id"]
            isOneToOne: false
            referencedRelation: "matiere_classe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cahier_texte_matiere_classe_id_fkey"
            columns: ["matiere_classe_id"]
            isOneToOne: false
            referencedRelation: "v_bulletin"
            referencedColumns: ["matiere_classe_id"]
          },
          {
            foreignKeyName: "cahier_texte_professeur_id_fkey"
            columns: ["professeur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          annee_scolaire_id: string
          cycle: Database["public"]["Enums"]["cycle_scolaire"]
          etablissement_id: string
          id: string
          niveau: string
          nom: string
          serie: string | null
        }
        Insert: {
          annee_scolaire_id: string
          cycle: Database["public"]["Enums"]["cycle_scolaire"]
          etablissement_id: string
          id?: string
          niveau: string
          nom: string
          serie?: string | null
        }
        Update: {
          annee_scolaire_id?: string
          cycle?: Database["public"]["Enums"]["cycle_scolaire"]
          etablissement_id?: string
          id?: string
          niveau?: string
          nom?: string
          serie?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_annee_scolaire_id_fkey"
            columns: ["annee_scolaire_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      creneaux: {
        Row: {
          created_at: string
          heure_debut: string
          heure_fin: string
          id: string
          jour_semaine: number
          matiere_classe_id: string
          professeur_id: string
          salle: string | null
        }
        Insert: {
          created_at?: string
          heure_debut: string
          heure_fin: string
          id?: string
          jour_semaine: number
          matiere_classe_id: string
          professeur_id: string
          salle?: string | null
        }
        Update: {
          created_at?: string
          heure_debut?: string
          heure_fin?: string
          id?: string
          jour_semaine?: number
          matiere_classe_id?: string
          professeur_id?: string
          salle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creneaux_matiere_classe_id_fkey"
            columns: ["matiere_classe_id"]
            isOneToOne: false
            referencedRelation: "matiere_classe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creneaux_matiere_classe_id_fkey"
            columns: ["matiere_classe_id"]
            isOneToOne: false
            referencedRelation: "v_bulletin"
            referencedColumns: ["matiere_classe_id"]
          },
          {
            foreignKeyName: "creneaux_professeur_id_fkey"
            columns: ["professeur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions_conseil_classe: {
        Row: {
          decision: string
          inscription_id: string
          periode_id: string
          publiee: boolean
        }
        Insert: {
          decision: string
          inscription_id: string
          periode_id: string
          publiee?: boolean
        }
        Update: {
          decision?: string
          inscription_id?: string
          periode_id?: string
          publiee?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "decisions_conseil_classe_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_conseil_classe_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes"
            referencedColumns: ["id"]
          },
        ]
      }
      etablissements: {
        Row: {
          academie: string | null
          adresse: string | null
          created_at: string
          id: string
          nom: string
          pays_calendrier: string
          retention_messagerie_mois: number
          retention_vie_scolaire_mois: number
        }
        Insert: {
          academie?: string | null
          adresse?: string | null
          created_at?: string
          id?: string
          nom: string
          pays_calendrier?: string
          retention_messagerie_mois?: number
          retention_vie_scolaire_mois?: number
        }
        Update: {
          academie?: string | null
          adresse?: string | null
          created_at?: string
          id?: string
          nom?: string
          pays_calendrier?: string
          retention_messagerie_mois?: number
          retention_vie_scolaire_mois?: number
        }
        Relationships: []
      }
      evenements_calendrier: {
        Row: {
          auteur_id: string | null
          cible: Database["public"]["Enums"]["role_utilisateur"] | null
          created_at: string
          date_debut: string
          date_fin: string
          description: string | null
          etablissement_id: string
          id: string
          lieu: string | null
          titre: string
        }
        Insert: {
          auteur_id?: string | null
          cible?: Database["public"]["Enums"]["role_utilisateur"] | null
          created_at?: string
          date_debut: string
          date_fin: string
          description?: string | null
          etablissement_id: string
          id?: string
          lieu?: string | null
          titre: string
        }
        Update: {
          auteur_id?: string | null
          cible?: Database["public"]["Enums"]["role_utilisateur"] | null
          created_at?: string
          date_debut?: string
          date_fin?: string
          description?: string | null
          etablissement_id?: string
          id?: string
          lieu?: string | null
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "evenements_calendrier_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_calendrier_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      historique_releves: {
        Row: {
          ancien_statut: Database["public"]["Enums"]["statut_note"] | null
          commentaire: string | null
          created_at: string
          id: string
          nouveau_statut: Database["public"]["Enums"]["statut_note"]
          par: string | null
          releve_id: string
        }
        Insert: {
          ancien_statut?: Database["public"]["Enums"]["statut_note"] | null
          commentaire?: string | null
          created_at?: string
          id?: string
          nouveau_statut: Database["public"]["Enums"]["statut_note"]
          par?: string | null
          releve_id: string
        }
        Update: {
          ancien_statut?: Database["public"]["Enums"]["statut_note"] | null
          commentaire?: string | null
          created_at?: string
          id?: string
          nouveau_statut?: Database["public"]["Enums"]["statut_note"]
          par?: string | null
          releve_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historique_releves_par_fkey"
            columns: ["par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historique_releves_releve_id_fkey"
            columns: ["releve_id"]
            isOneToOne: false
            referencedRelation: "releves_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      inscriptions: {
        Row: {
          annee_scolaire_id: string
          classe_id: string
          date_inscription: string
          eleve_id: string
          id: string
        }
        Insert: {
          annee_scolaire_id: string
          classe_id: string
          date_inscription?: string
          eleve_id: string
          id?: string
        }
        Update: {
          annee_scolaire_id?: string
          classe_id?: string
          date_inscription?: string
          eleve_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscriptions_annee_scolaire_id_fkey"
            columns: ["annee_scolaire_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          actif: boolean
          classe_id: string | null
          code: string
          created_at: string
          created_by: string | null
          eleve_id: string | null
          etablissement_id: string
          id: string
          role: Database["public"]["Enums"]["role_utilisateur"]
        }
        Insert: {
          actif?: boolean
          classe_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          eleve_id?: string | null
          etablissement_id: string
          id?: string
          role: Database["public"]["Enums"]["role_utilisateur"]
        }
        Update: {
          actif?: boolean
          classe_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          eleve_id?: string | null
          etablissement_id?: string
          id?: string
          role?: Database["public"]["Enums"]["role_utilisateur"]
        }
        Relationships: [
          {
            foreignKeyName: "invitations_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      liens_parents_eleves: {
        Row: {
          eleve_id: string
          id: string
          parent_id: string
        }
        Insert: {
          eleve_id: string
          id?: string
          parent_id: string
        }
        Update: {
          eleve_id?: string
          id?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liens_parents_eleves_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liens_parents_eleves_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matiere_classe: {
        Row: {
          annee_scolaire_id: string
          classe_id: string
          coefficient: number
          id: string
          matiere_id: string
        }
        Insert: {
          annee_scolaire_id: string
          classe_id: string
          coefficient?: number
          id?: string
          matiere_id: string
        }
        Update: {
          annee_scolaire_id?: string
          classe_id?: string
          coefficient?: number
          id?: string
          matiere_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matiere_classe_annee_scolaire_id_fkey"
            columns: ["annee_scolaire_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matiere_classe_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matiere_classe_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
        ]
      }
      matieres: {
        Row: {
          code: string | null
          etablissement_id: string
          id: string
          nom: string
        }
        Insert: {
          code?: string | null
          etablissement_id: string
          id?: string
          nom: string
        }
        Update: {
          code?: string | null
          etablissement_id?: string
          id?: string
          nom?: string
        }
        Relationships: [
          {
            foreignKeyName: "matieres_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      message_destinataires: {
        Row: {
          destinataire_id: string
          id: string
          lu: boolean
          lu_le: string | null
          message_id: string
          supprime: boolean
        }
        Insert: {
          destinataire_id: string
          id?: string
          lu?: boolean
          lu_le?: string | null
          message_id: string
          supprime?: boolean
        }
        Update: {
          destinataire_id?: string
          id?: string
          lu?: boolean
          lu_le?: string | null
          message_id?: string
          supprime?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "message_destinataires_destinataire_id_fkey"
            columns: ["destinataire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_destinataires_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_pieces_jointes: {
        Row: {
          chemin_fichier: string
          created_at: string
          id: string
          message_id: string
          nom_fichier: string
          taille_octets: number | null
          type_mime: string | null
        }
        Insert: {
          chemin_fichier: string
          created_at?: string
          id?: string
          message_id: string
          nom_fichier: string
          taille_octets?: number | null
          type_mime?: string | null
        }
        Update: {
          chemin_fichier?: string
          created_at?: string
          id?: string
          message_id?: string
          nom_fichier?: string
          taille_octets?: number | null
          type_mime?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_pieces_jointes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          corps: string
          created_at: string
          expediteur_id: string
          id: string
          parent_message_id: string | null
          sujet: string
          supprime_expediteur: boolean
        }
        Insert: {
          corps: string
          created_at?: string
          expediteur_id: string
          id?: string
          parent_message_id?: string | null
          sujet: string
          supprime_expediteur?: boolean
        }
        Update: {
          corps?: string
          created_at?: string
          expediteur_id?: string
          id?: string
          parent_message_id?: string | null
          sujet?: string
          supprime_expediteur?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "messages_expediteur_id_fkey"
            columns: ["expediteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          coefficient_note: number
          commentaire: string | null
          composition: number | null
          created_at: string
          devoir_1: number | null
          devoir_2: number | null
          devoir_departemental: number | null
          eleve_id: string
          id: string
          libelle: string | null
          releve_id: string
          updated_at: string
          valeur: number | null
        }
        Insert: {
          coefficient_note?: number
          commentaire?: string | null
          composition?: number | null
          created_at?: string
          devoir_1?: number | null
          devoir_2?: number | null
          devoir_departemental?: number | null
          eleve_id: string
          id?: string
          libelle?: string | null
          releve_id: string
          updated_at?: string
          valeur?: number | null
        }
        Update: {
          coefficient_note?: number
          commentaire?: string | null
          composition?: number | null
          created_at?: string
          devoir_1?: number | null
          devoir_2?: number | null
          devoir_departemental?: number | null
          eleve_id?: string
          id?: string
          libelle?: string | null
          releve_id?: string
          updated_at?: string
          valeur?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_releve_id_fkey"
            columns: ["releve_id"]
            isOneToOne: false
            referencedRelation: "releves_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          contenu: string | null
          created_at: string
          destinataire_id: string
          etablissement_id: string
          id: string
          lien: string | null
          lu: boolean
          titre: string
          type: string
        }
        Insert: {
          contenu?: string | null
          created_at?: string
          destinataire_id: string
          etablissement_id: string
          id?: string
          lien?: string | null
          lu?: boolean
          titre: string
          type: string
        }
        Update: {
          contenu?: string | null
          created_at?: string
          destinataire_id?: string
          etablissement_id?: string
          id?: string
          lien?: string | null
          lu?: boolean
          titre?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_destinataire_id_fkey"
            columns: ["destinataire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      periodes: {
        Row: {
          annee_scolaire_id: string
          date_debut: string
          date_fin: string
          echeance_bulletins: string | null
          fin_compositions: string | null
          id: string
          nom: string
          ordre: number
        }
        Insert: {
          annee_scolaire_id: string
          date_debut: string
          date_fin: string
          echeance_bulletins?: never
          fin_compositions?: string | null
          id?: string
          nom: string
          ordre: number
        }
        Update: {
          annee_scolaire_id?: string
          date_debut?: string
          date_fin?: string
          echeance_bulletins?: never
          fin_compositions?: string | null
          id?: string
          nom?: string
          ordre?: number
        }
        Relationships: [
          {
            foreignKeyName: "periodes_annee_scolaire_id_fkey"
            columns: ["annee_scolaire_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          actif: boolean
          created_at: string
          email: string
          etablissement_id: string
          id: string
          nom: string
          prenom: string
          role: Database["public"]["Enums"]["role_utilisateur"]
        }
        Insert: {
          actif?: boolean
          created_at?: string
          email: string
          etablissement_id: string
          id: string
          nom: string
          prenom: string
          role: Database["public"]["Enums"]["role_utilisateur"]
        }
        Update: {
          actif?: boolean
          created_at?: string
          email?: string
          etablissement_id?: string
          id?: string
          nom?: string
          prenom?: string
          role?: Database["public"]["Enums"]["role_utilisateur"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      releves_notes: {
        Row: {
          commentaire_direction: string | null
          created_at: string
          id: string
          matiere_classe_id: string
          periode_id: string
          professeur_id: string | null
          publie_le: string | null
          soumis_le: string | null
          statut: Database["public"]["Enums"]["statut_note"]
          updated_at: string
          valide_le: string | null
          valide_par: string | null
        }
        Insert: {
          commentaire_direction?: string | null
          created_at?: string
          id?: string
          matiere_classe_id: string
          periode_id: string
          professeur_id?: string | null
          publie_le?: string | null
          soumis_le?: string | null
          statut?: Database["public"]["Enums"]["statut_note"]
          updated_at?: string
          valide_le?: string | null
          valide_par?: string | null
        }
        Update: {
          commentaire_direction?: string | null
          created_at?: string
          id?: string
          matiere_classe_id?: string
          periode_id?: string
          professeur_id?: string | null
          publie_le?: string | null
          soumis_le?: string | null
          statut?: Database["public"]["Enums"]["statut_note"]
          updated_at?: string
          valide_le?: string | null
          valide_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "releves_notes_matiere_classe_id_fkey"
            columns: ["matiere_classe_id"]
            isOneToOne: false
            referencedRelation: "matiere_classe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "releves_notes_matiere_classe_id_fkey"
            columns: ["matiere_classe_id"]
            isOneToOne: false
            referencedRelation: "v_bulletin"
            referencedColumns: ["matiere_classe_id"]
          },
          {
            foreignKeyName: "releves_notes_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "releves_notes_professeur_id_fkey"
            columns: ["professeur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "releves_notes_valide_par_fkey"
            columns: ["valide_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      remises_bulletins: {
        Row: {
          destinataire: string
          inscription_id: string
          periode_id: string
          remis_le: string
        }
        Insert: {
          destinataire: string
          inscription_id: string
          periode_id: string
          remis_le?: string
        }
        Update: {
          destinataire?: string
          inscription_id?: string
          periode_id?: string
          remis_le?: string
        }
        Relationships: [
          {
            foreignKeyName: "remises_bulletins_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remises_bulletins_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes"
            referencedColumns: ["id"]
          },
        ]
      }
      ressources_pedagogiques: {
        Row: {
          chemin_fichier: string
          created_at: string
          id: string
          matiere_classe_id: string
          professeur_id: string | null
          taille_octets: number | null
          titre: string
          type_mime: string | null
        }
        Insert: {
          chemin_fichier: string
          created_at?: string
          id?: string
          matiere_classe_id: string
          professeur_id?: string | null
          taille_octets?: number | null
          titre: string
          type_mime?: string | null
        }
        Update: {
          chemin_fichier?: string
          created_at?: string
          id?: string
          matiere_classe_id?: string
          professeur_id?: string | null
          taille_octets?: number | null
          titre?: string
          type_mime?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ressources_pedagogiques_matiere_classe_id_fkey"
            columns: ["matiere_classe_id"]
            isOneToOne: false
            referencedRelation: "matiere_classe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ressources_pedagogiques_matiere_classe_id_fkey"
            columns: ["matiere_classe_id"]
            isOneToOne: false
            referencedRelation: "v_bulletin"
            referencedColumns: ["matiere_classe_id"]
          },
          {
            foreignKeyName: "ressources_pedagogiques_professeur_id_fkey"
            columns: ["professeur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vie_scolaire_evenements: {
        Row: {
          classe_id: string
          created_at: string
          creneau_id: string | null
          date: string
          description: string | null
          duree_minutes: number | null
          eleve_id: string
          id: string
          justificatif_chemin: string | null
          justifie: boolean
          motif: string | null
          signale_par: string | null
          type: string
        }
        Insert: {
          classe_id: string
          created_at?: string
          creneau_id?: string | null
          date: string
          description?: string | null
          duree_minutes?: number | null
          eleve_id: string
          id?: string
          justificatif_chemin?: string | null
          justifie?: boolean
          motif?: string | null
          signale_par?: string | null
          type: string
        }
        Update: {
          classe_id?: string
          created_at?: string
          creneau_id?: string | null
          date?: string
          description?: string | null
          duree_minutes?: number | null
          eleve_id?: string
          id?: string
          justificatif_chemin?: string | null
          justifie?: boolean
          motif?: string | null
          signale_par?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vie_scolaire_evenements_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vie_scolaire_evenements_creneau_id_fkey"
            columns: ["creneau_id"]
            isOneToOne: false
            referencedRelation: "creneaux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vie_scolaire_evenements_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vie_scolaire_evenements_signale_par_fkey"
            columns: ["signale_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_bulletin: {
        Row: {
          coefficient: number | null
          eleve_id: string | null
          matiere: string | null
          matiere_classe_id: string | null
          moyenne: number | null
          periode_id: string | null
          publie_le: string | null
          statut: Database["public"]["Enums"]["statut_note"] | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "releves_notes_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      ajouter_justificatif_absence: {
        Args: { p_chemin: string; p_vie_scolaire_id: string }
        Returns: undefined
      }
      annuaire_etablissement: {
        Args: never
        Returns: {
          email: string
          id: string
          nom: string
          prenom: string
          role: Database["public"]["Enums"]["role_utilisateur"]
        }[]
      }
      calculer_moyenne_generale: {
        Args: { p_eleve_id: string; p_periode_id: string }
        Returns: number
      }
      calculer_moyenne_matiere: {
        Args: {
          p_eleve_id: string
          p_matiere_classe_id: string
          p_periode_id: string
        }
        Returns: number
      }
      classe_etablissement_id: {
        Args: { p_classe_id: string }
        Returns: string
      }
      current_etablissement_id: { Args: never; Returns: string }
      current_profile_role: {
        Args: never
        Returns: Database["public"]["Enums"]["role_utilisateur"]
      }
      eleve_a_acces_classe: { Args: { p_classe_id: string }; Returns: boolean }
      eleve_a_note_sur_releve: {
        Args: { p_releve_id: string }
        Returns: boolean
      }
      envoyer_message: {
        Args: {
          p_corps: string
          p_destinataires: string[]
          p_parent_message_id?: string
          p_sujet: string
        }
        Returns: string
      }
      est_destinataire_message: {
        Args: { p_message_id: string }
        Returns: boolean
      }
      invitation_par_code: {
        Args: { p_code: string }
        Returns: {
          classe_nom: string
          eleve_nom: string
          eleve_prenom: string
          etablissement_nom: string
          id: string
          role: Database["public"]["Enums"]["role_utilisateur"]
        }[]
      }
      matiere_classe_classe_id: {
        Args: { p_matiere_classe_id: string }
        Returns: string
      }
      parent_a_acces_classe: { Args: { p_classe_id: string }; Returns: boolean }
      parent_a_enfant_note_sur_releve: {
        Args: { p_releve_id: string }
        Returns: boolean
      }
      professeur_a_acces_classe: {
        Args: { p_classe_id: string }
        Returns: boolean
      }
      profile_etablissement_id: { Args: { p_user_id: string }; Returns: string }
      publier_releve: { Args: { p_releve_id: string }; Returns: undefined }
      purger_donnees_expirees: { Args: never; Returns: undefined }
      rejeter_releve: {
        Args: { p_commentaire: string; p_releve_id: string }
        Returns: undefined
      }
      releve_est_publie: { Args: { p_releve_id: string }; Returns: boolean }
      soumettre_releve: { Args: { p_releve_id: string }; Returns: undefined }
      supprimer_message_envoye: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      valider_releve: {
        Args: { p_commentaire?: string; p_releve_id: string }
        Returns: undefined
      }
    }
    Enums: {
      cycle_scolaire: "primaire" | "college" | "lycee"
      role_utilisateur: "direction" | "professeur" | "eleve" | "parent"
      statut_note: "brouillon" | "soumise" | "validee" | "publiee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cycle_scolaire: ["primaire", "college", "lycee"],
      role_utilisateur: ["direction", "professeur", "eleve", "parent"],
      statut_note: ["brouillon", "soumise", "validee", "publiee"],
    },
  },
} as const
