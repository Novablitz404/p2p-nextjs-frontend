// app/(dapp)/page.tsx

import LandingPage from "@/components/marketing/LandingPage";
import { dbAdmin } from "@/lib/firebase-admin";
import { Order } from "@/types";
import { Timestamp } from "firebase-admin/firestore";

// Helper type for raw Firestore data
type OrderDocumentData = Omit<Order, 'id' | 'createdAt'> & {
  createdAt: Timestamp;
};

async function getLiveOrders(): Promise<Order[]> {
  try {
    const ordersSnapshot = await dbAdmin
      .collection('orders')
      .where('status', '==', 'OPEN')
      .orderBy('createdAt', 'desc')
      .limit(6)
      .get();
      
    const orders = ordersSnapshot.docs.map(doc => {
      // --- THIS IS THE FIX ---
      // 1. We cast the raw data to our helper type so TypeScript knows its shape.
      const data = doc.data() as OrderDocumentData;

      // 2. Now we can safely spread the data and modify the timestamp.
      return {
        ...data,
        id: doc.id,
        // Convert Firestore Timestamp to a serializable format for the client
        createdAt: data.createdAt.toMillis(),
      } as unknown as Order; // Use 'unknown' to bridge the type difference
    });

    return orders;
  } catch (error) {
    console.error("Failed to fetch live orders:", error);
    return [];
  }
}

export default async function HomePage() {
  const liveOrders = await getLiveOrders();

  return (
    <LandingPage liveOrders={liveOrders} />
  );
}