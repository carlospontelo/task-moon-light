export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string; // ISO date string YYYY-MM-DD
  createdAt: string;
}
