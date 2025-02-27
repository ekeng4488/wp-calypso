/**
 * External dependencies
 */
import { By, Condition } from 'selenium-webdriver';

/**
 * Internal dependencies
 */
import * as driverHelper from '../../driver-helper.js';
import * as dataHelper from '../../data-helper';
import AsyncBaseContainer from '../../async-base-container';

export default class AccountSettingsPage extends AsyncBaseContainer {
	constructor( driver, url = dataHelper.getCalypsoURL( 'me/account' ) ) {
		super( driver, By.css( '.account.main' ), url );
	}

	async chooseCloseYourAccount() {
		const closeAccountSelector = By.css( '.account__settings-close' );
		await driverHelper.scrollIntoView( this.driver, closeAccountSelector, 'end' );
		return await driverHelper.clickWhenClickable( this.driver, closeAccountSelector );
	}

	getUsername() {
		return this.driver.wait(
			new Condition( 'for username to be available', async () => {
				try {
					const element = await this.driver.findElement( By.css( 'input#user_login' ) );
					const username = await element.getAttribute( 'value' );

					return username ? username : null;
				} catch {
					return null;
				}
			} ),
			2000
		);
	}
}
