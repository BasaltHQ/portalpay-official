
/**
 * Uber Eats Delivery Types
 */

export interface UberEatsConfig {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    storeId: string; // The specific store UUID in UberEats
    customerId?: string; // Optional parent org ID
    webhookSecret?: string; // For signature validation
}

export interface UberEatsTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

// Minimal shape for incoming webhooks (eats.order_created)
export interface UberWebhookEvent {
    event_id: string;
    event_time: number;
    event_type: "orders.notification" | "orders.failed" | "orders.cancel" | "store.status";
    meta: {
        user_id: string; // The store ID (confusingly named user_id in some Uber docs contexts, or resource_id)
        resource_id: string;
        resource_type: string;
    };
    resource_href: string; // URL to fetch the full resource
}

// The full Order object fetched from GET /eats/orders/{orderId}
export interface UberOrder {
    id: string;
    display_id: string;
    external_reference_id?: string;
    current_state: "CREATED" | "ACCEPTED" | "DENIED" | "FINISHED" | "CANCELED";
    placed_at: string; // ISO8601
    estimated_ready_for_pickup_at?: string;
    type: "DELIVERY" | "PICK_UP" | "DINE_IN";
    eater: {
        first_name: string;
        phone?: string;
        // delivery location for heatmap
        delivery_address?: {
            location?: {
                latitude: number;
                longitude: number;
            }
        };
    };
    cart: {
        items: Array<{
            id: string;
            title: string;
            quantity: number;
            price: {
                amount: number;
                currency_code: string;
            };
            special_instructions?: string;
        }>;
    };
    payment: {
        charges: {
            total: {
                amount: number;
                currency_code: string;
            };
        };
    };
    // Courier info (available when dispatching)
    courier?: {
        name: string;
        phone?: string;
        vehicle_type?: "BICYCLE" | "CAR" | "SCOOTER" | "WALKER";
        location?: {
            latitude: number;
            longitude: number;
        };
    };
}
