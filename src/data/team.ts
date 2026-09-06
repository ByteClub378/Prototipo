export interface TeamMember {
  id: number;
  name: string;
  role: string;
  initials: string;
  github?: string;
  linkedin?: string;
}

// TODO: trocar pelos dados reais da equipe antes da entrega.
export const TEAM_MEMBERS: TeamMember[] = [
  { id: 1, name: "Gabrielle Mardinoto Monteiro da Silva", role: "Product Owner", initials: "PO", github: "", linkedin: "" },
  { id: 2, name: "Leonardo Maia Tiburcio", role: "Scrum Master", initials: "SM", github: "", linkedin: "" },
  { id: 3, name: "Lavínea Narciso Santos", role: "Quality Assurance", initials: "QA", github: "", linkedin: "" },
  { id: 4, name: "Davi Belo de Souza", role: "Dev. Backend", initials: "D1", github: "", linkedin: "" },
  { id: 5, name: "Kauã Amaro Pires", role: "Dev. Backend", initials: "D2", github: "", linkedin: "" },
  { id: 6, name: "Rafael Pontes", role: "Dev. Frontend", initials: "D3", github: "", linkedin: "" },
  { id: 7, name: "Aleph Dias Messias da Silva", role: "Dev. Frontend", initials: "D4", github: "", linkedin: "" },
  { id: 8, name: "João Ursino", role: "´Gerente - Professor" , initials: 'PF'}
];