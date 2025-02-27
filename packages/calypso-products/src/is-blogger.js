/**
 * Internal dependencies
 */
import { isBloggerPlan } from './index';
import { assertValidProduct } from './utils/assert-valid-product';
import { formatProduct } from './format-product';

export function isBlogger( product ) {
	product = formatProduct( product );
	assertValidProduct( product );

	return isBloggerPlan( product.product_slug );
}
