import { config } from 'dotenv';
import {DateTime} from "luxon";

// Load environment variables
config();

interface Content {
    accountKey: string | null;
    title: string | null;
    authorKey: string | null;
    organisationKey: string;
    applicationKey: string;
    access: number;
    rating: number;
    description: string | null;
    guid: string | null;
    contentUri: string;
    previewUri: string;
    metaUri: string;
    metaJsonUri: string;
    ipfsContent: string;
    ipfsPreview: string | null;
    ipfsMeta: string;
    ipfsJson: string;
    readModel: string;
    writeModel: string;
    readPrice: number | null;
    writePrice: number | null;
    currency: string | null;
    mimeType: string | null;
    priceCount: number | null;
    active: boolean;
    sourceUri: string;
    encrypt: boolean;
    createdAt: DateTime | null;
    updatedAt: DateTime | null;
    tags: string;
}

/**
 * Fetches content from the LettsCore API
 * @param bearerToken - Optional API token for authentication. If not provided, request will be made without authorization.
 * @returns Promise<Content[]> - Array of content items
 */
export async function getLettsCoreContent(bearerToken?: string): Promise<Content[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    const response = await fetch(process.env.LETTS_CORE_API_URL + '/content', {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as Content[];
  } catch (error) {
    console.error('Error fetching content from LettsCore API:', error);
    throw error;
  }
}