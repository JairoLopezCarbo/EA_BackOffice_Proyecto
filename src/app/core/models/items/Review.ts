export interface ReviewItem {
  _id: string;
  userId: string;
  routeId: string;
  title: string;
  comment?: string;
  ratings: {
    label: string;
    score: number;
  }[];
  createdAt?: string;
  updatedAt?: string;
  // [key: string]: unknown; // Uncomment if you want to allow additional properties
}


export interface CreateReviewPayload {
  userId: string;
  routeId: string;
  title: string;
  comment?: string;
  ratings: {
    label: string;
    score: number;
  }[];
}

export type UpdateReviewPayload = Partial<CreateReviewPayload>;