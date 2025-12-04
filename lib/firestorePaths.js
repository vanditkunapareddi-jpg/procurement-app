import { collection, doc } from "firebase/firestore";

export const accountCollection = (db, accountId, subcollection) =>
  collection(db, "accounts", accountId, subcollection);

export const accountDoc = (db, accountId, subcollection, docId) =>
  doc(db, "accounts", accountId, subcollection, docId);
