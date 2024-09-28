export interface Info {
  eventTitle: string;
  checkedIn: number;
  total: number;
  ticketTypes: { id: number; name: string }[];
}

export interface Ticket {
  firstname: string;
  lastname: string;
  ticketTypeId: number;
}

export interface CheckInResult {
  checkedInTickets: Ticket[];
  usedTickets: Ticket[];
  checkedIn: number;
}

export interface UndoResult {
  undoneTickets: Ticket[];
  checkedIn: number;
}
