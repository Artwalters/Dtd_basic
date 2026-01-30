const DISCOUNT_CODE_CREATE_MUTATION = `
  mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            codes(first: 1) {
              nodes {
                code
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `DTD-WELCOME-${suffix}`;
}

async function getAdminAccessToken(
  storeDomain: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const response = await fetch(
    `https://${storeDomain}/admin/oauth/access_token`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    },
  );

  const text = await response.text();
  console.log('[Admin API] Token response status:', response.status);
  console.log('[Admin API] Token response body:', text);

  if (!response.ok) {
    throw new Error(`Failed to get admin access token: ${response.status} ${text}`);
  }

  const data = JSON.parse(text);
  return data.access_token;
}

export async function createDiscountCode(env: Env): Promise<string> {
  const storeDomain = env.PUBLIC_STORE_DOMAIN || 'yfszjw-2v.myshopify.com';
  const clientId = env.SHOPIFY_ADMIN_CLIENT_ID;
  const clientSecret = env.SHOPIFY_ADMIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing SHOPIFY_ADMIN_CLIENT_ID or SHOPIFY_ADMIN_CLIENT_SECRET');
  }

  console.log('[Admin API] Getting access token for store:', storeDomain);
  const accessToken = await getAdminAccessToken(storeDomain, clientId, clientSecret);
  console.log('[Admin API] Got access token, creating discount code...');

  const code = generateCode();
  const startsAt = new Date().toISOString();
  const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    `https://${storeDomain}/admin/api/2024-10/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query: DISCOUNT_CODE_CREATE_MUTATION,
        variables: {
          basicCodeDiscount: {
            title: `Welcome ${code}`,
            code,
            startsAt,
            endsAt,
            customerSelection: {
              all: true,
            },
            customerGets: {
              value: {
                percentage: 0.1,
              },
              items: {
                all: true,
              },
            },
            usageLimit: 1,
            appliesOncePerCustomer: true,
          },
        },
      }),
    },
  );

  const resultText = await response.text();
  console.log('[Admin API] Discount response status:', response.status);
  console.log('[Admin API] Discount response body:', resultText);

  if (!response.ok) {
    throw new Error(`Admin API error: ${response.status} ${resultText}`);
  }

  const result = JSON.parse(resultText);
  const userErrors = result?.data?.discountCodeBasicCreate?.userErrors;

  if (userErrors?.length) {
    throw new Error(`Discount creation failed: ${userErrors[0].message}`);
  }

  const createdCode =
    result?.data?.discountCodeBasicCreate?.codeDiscountNode?.codeDiscount
      ?.codes?.nodes?.[0]?.code;

  return createdCode || code;
}
