import { useContext } from 'react';
import { DatabaseContext } from '../providers/databaseProvider';

export default function useDatabase() {
  const { database } = useContext(DatabaseContext);
  return database;
}
