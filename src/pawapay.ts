
import {DateTime} from "luxon";

export interface ActiveConf {
    merchantId: string | null;
    merchantName: string | null;
    countries: [
      {
        country: string | null;
        correspondents: [{
          correspondent: string | null,
          currency: string | null,
          ownerName: string | null,
          operationTypes: [
            {
              operationType: string | null,
              minTransactionLimit: string | null,
              maxTransactionLimit: string | null
            }
          ]
        }]
      }
    ]
}

export interface DepositRequest {
  depositId: string | null;
  amount: string | null,
  currency: string | null,
  country: string | null,
  correspondent: string | null,
  payer: {
    type: string | null,
    address: {
      value: string | null,
    } 
  }
  customerTimestamp: string | null,
  statementDescription: string | null,
  preAuthorisationCode: string | null,
  metadata: [
    {
      fieldName: string | null,
      fieldValue: string | null,
      isPII: boolean | null,
    }
  ] | null
}

export interface DepositResponse {
  depositId: string | null;
  status: string | null;
  created: string | null;
  rejectionReason: {
    rejectionCode: string | null,
    rejectionMessage: string | null,
  } | null
}

export interface AvailabilityResponse {
  country: string | null;
  correspondents: [
    {
      correspondent: string | null;
      operationTypes: [
        {
          operationType: string | null;
          status: string | null;
        }
      ]
    }
  ]
}

export interface PredictCorrespondentResponse {
 country: string | null;
 operator: string | null;
 correspondent: string | null;
 msisdn: string | null;

}

/**
 * Fetches activveConf from pawaPay API
 * @param bearerToken - Required API token for authentication..
 * @returns Promise<ActiveConf> - ActiveConf JSON Object
 */
export async function getActiveConf(bearerToken?: string, apiUrl?: string): Promise<ActiveConf> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    const response = await fetch(apiUrl + '/active-conf', {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as ActiveConf;
  } catch (error) {
    console.error('Error fetching activeConf from pawaPay API:', error);
    throw error;
  }
}

export async function getCorrespondentAvailability(apiUrl?: string): Promise<AvailabilityResponse[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };


    const response = await fetch(apiUrl + '/availability', {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as AvailabilityResponse[];
  } catch (error) {
    console.error('Error fetching availability from pawaPay API:', error);
    throw error;
  }
}

export async function getCorrespondentPredict(msisdn: string, bearerToken?: string, apiUrl?: string): Promise<PredictCorrespondentResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    const response = await fetch(apiUrl + '/v1/predict-correspondent', {
      method: 'POST',
      headers,
      body: JSON.stringify({msisdn})
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as PredictCorrespondentResponse;
  } catch (error) {
    console.error('Error fetching predictCorrespondent from pawaPay API:', error);
    throw error;
  }
}

export async function sendDeposit(depositRequest: DepositRequest, bearerToken?: string, apiUrl?: string): Promise<DepositResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    const response = await fetch(apiUrl + '/deposits', {
      method: 'POST',
      headers,
      body: JSON.stringify(depositRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as DepositResponse;
  } catch (error) {
    console.error('Error sending deposit from pawaPay API:', error);
    throw error;
  }
}

export async function getDeposit(depositId: string, bearerToken?: string, apiUrl?: string): Promise<DepositResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    const response = await fetch(apiUrl + '/deposits/' + depositId, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as DepositResponse;
  } catch (error) {
    console.error('Error sending deposit from pawaPay API:', error);
    throw error;
  }
}