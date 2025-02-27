/**
 * External dependencies
 */
import page from 'page';

/**
 * Internal dependencies
 */
import { makeLayout, render as clientRender } from 'calypso/controller/index.web';
import * as controller from './controller';

/**
 * Style dependencies
 */
import './style.scss';

export default function () {
	// Load the partner for the current user.
	page( `/partner-portal/partner`, controller.partnerContext, makeLayout, clientRender );

	// Display the ToS, if necessary.
	page(
		`/partner-portal/terms-of-service`,
		controller.requireAccessContext,
		controller.termsOfServiceContext,
		makeLayout,
		clientRender
	);

	// Display the list of partner keys for the user to select from.
	page(
		`/partner-portal/partner-key`,
		controller.requireAccessContext,
		controller.requireTermsOfServiceConsentContext,
		controller.partnerKeyContext,
		makeLayout,
		clientRender
	);

	// List licenses.
	page(
		`/partner-portal/licenses/:filter(unassigned|assigned|revoked)?`,
		controller.requireAccessContext,
		controller.requireTermsOfServiceConsentContext,
		controller.requireSelectedPartnerKeyContext,
		controller.licensesContext,
		makeLayout,
		clientRender
	);

	// Redirect invalid license list filters back to the main portal page.
	page( `/partner-portal/licenses/*`, '/partner-portal/licenses' );

	// Issue a license.
	page(
		`/partner-portal/issue-license`,
		controller.requireAccessContext,
		controller.requireTermsOfServiceConsentContext,
		controller.requireSelectedPartnerKeyContext,
		controller.issueLicenseContext,
		makeLayout,
		clientRender
	);

	// Billing Dashboard.
	page(
		`/partner-portal`,
		controller.requireAccessContext,
		controller.requireTermsOfServiceConsentContext,
		controller.requireSelectedPartnerKeyContext,
		controller.billingDashboardContext,
		makeLayout,
		clientRender
	);
}
