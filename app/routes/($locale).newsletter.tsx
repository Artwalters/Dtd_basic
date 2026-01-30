import {data} from 'react-router';
import type {Route} from './+types/($locale).newsletter';
import {createDiscountCode} from '~/lib/admin';

const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation customerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim();
  const source = String(formData.get('source') || '');

  if (!email) {
    return data({success: false, error: 'Please enter an email address.', discountCode: null}, {status: 400});
  }

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

    const errors = result?.customerCreate?.userErrors;

    if (errors?.length) {
      const alreadyExists = errors.some(
        (e: {message: string}) =>
          e.message.toLowerCase().includes('taken') ||
          e.message.toLowerCase().includes('already exists'),
      );
      if (alreadyExists) {
        if (source === 'discount') {
          return data({
            success: false,
            error: 'You already claimed your discount. Use a creator code instead!',
            discountCode: null,
          }, {status: 400});
        }
        return data({success: true, error: null, discountCode: null});
      }
      return data({success: false, error: errors[0].message, discountCode: null}, {status: 400});
    }

    let discountCode: string | null = null;
    if (source === 'discount') {
      try {
        discountCode = await createDiscountCode(context.env);
      } catch (err) {
        console.error('Discount code generation failed:', err);
      }
    }

    return data({success: true, error: null, discountCode});
  } catch (err) {
    console.error('Newsletter signup error:', err);
    return data(
      {success: false, error: 'Something went wrong. Please try again.', discountCode: null},
      {status: 500},
    );
  }
}
