import {data} from 'react-router';
import type {Route} from './+types/($locale).newsletter';

const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim();

  if (!email) {
    return data({success: false, error: 'Please enter an email address.'}, {status: 400});
  }

  // Generate a random password — required by the API but the subscriber won't use it
  const password = crypto.randomUUID();

  try {
    const result = await context.storefront.mutate(CUSTOMER_CREATE_MUTATION, {
      variables: {
        input: {
          email,
          password,
          acceptsMarketing: true,
        },
      },
    });

    const errors = result?.customerCreate?.customerUserErrors;

    if (errors?.length) {
      const alreadyExists = errors.some(
        (e: {code: string}) => e.code === 'TAKEN' || e.code === 'CUSTOMER_DISABLED',
      );
      if (alreadyExists) {
        return data({success: false, error: 'This email is already subscribed.'}, {status: 409});
      }
      return data({success: false, error: errors[0].message}, {status: 400});
    }

    return data({success: true, error: null});
  } catch (err) {
    console.error('Newsletter signup error:', err);
    return data(
      {success: false, error: 'Something went wrong. Please try again.'},
      {status: 500},
    );
  }
}
