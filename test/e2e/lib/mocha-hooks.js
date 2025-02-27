/* eslint-disable mocha/no-top-level-hooks */

/**
 * External dependencies
 */
import config from 'config';
import assert from 'assert';

/**
 * Internal dependencies
 */
import * as slackNotifier from './slack-notifier';

import * as mediaHelper from './media-helper';

import * as driverManager from './driver-manager';
import * as videoRecorder from '../lib/video-recorder';
import { default as saveConsoleLog } from './hooks/save-console-log';

const afterHookTimeoutMS = config.get( 'afterHookTimeoutMS' );
let allPassed = true; // For SauceLabs status

before( function () {
	if ( process.env.LIVEBRANCHES === 'true' ) {
		const isCalypsoLiveURL = config.get( 'calypsoBaseURL' ).includes( 'calypso.live' );
		assert.strictEqual( isCalypsoLiveURL, true );
	}
} );

// Start xvfb display and recording
before( async function () {
	await videoRecorder.startDisplay();
} );

// Start xvfb display and recording
before( async function () {
	await videoRecorder.startVideo();
} );

// Sauce Breakpoint
afterEach( function () {
	const driver = global.__BROWSER__;

	if (
		process.env.SAUCEDEBUG &&
		this.currentTest.state === 'failed' &&
		config.has( 'sauce' ) &&
		config.get( 'sauce' )
	) {
		driver.executeScript( 'sauce: break' );
	}
} );

// Take Screenshot
afterEach( async function () {
	this.timeout( afterHookTimeoutMS );
	if ( ! this.currentTest ) {
		return;
	}
	allPassed = allPassed && this.currentTest.state === 'passed';

	const driver = global.__BROWSER__;
	const shortTestFileName = this.currentTest.title.replace( /[^a-z0-9]/gi, '-' ).toLowerCase();
	const shortDescribeFileName = this.currentTest
		.fullTitle()
		.replace( /.*\)/gi, '' )
		.replace( /\@.*/gi, '' ) // eslint-disable-line no-useless-escape
		.replace( /[^a-z0-9]/gi, '-' )
		.toLowerCase();

	const screenSize = driverManager.currentScreenSize().toUpperCase();
	const locale = driverManager.currentLocale().toUpperCase();
	const date = new Date().getTime().toString();
	let filenameCallback;

	if ( this.currentTest.state === 'failed' ) {
		const neverSaveScreenshots = config.get( 'neverSaveScreenshots' );
		if ( neverSaveScreenshots ) {
			return null;
		}

		await driver.getCurrentUrl().then(
			( url ) => console.log( `FAILED: Taking screenshot of: '${ url }'` ),
			( err ) => {
				slackNotifier.warn( `Could not capture the URL when taking a screenshot: '${ err }'` );
			}
		);

		filenameCallback = () => `FAILED-${ locale }-${ screenSize }-${ shortTestFileName }-${ date }`;
	} else if ( config.get( 'saveAllScreenshots' ) === true ) {
		filenameCallback = () =>
			`${ locale }-${ screenSize }-${ shortDescribeFileName }-${ date }-${ shortTestFileName }`;
	} else {
		return;
	}

	return await driver.takeScreenshot().then(
		async ( data ) => {
			return await driver.getCurrentUrl().then( async ( url ) => {
				return await mediaHelper.writeScreenshot( data, filenameCallback, { url } );
			} );
		},
		( err ) => {
			slackNotifier.warn( `Could not take screenshot due to error: '${ err }'`, {
				suppressDuplicateMessages: true,
			} );
		}
	);
} );

// Dismiss any alerts for switching away
afterEach( async function () {
	await this.timeout( afterHookTimeoutMS );
	const driver = global.__BROWSER__;

	if (
		this.currentTest &&
		this.currentTest.state === 'failed' &&
		( config.get( 'closeBrowserOnComplete' ) === true || global.isHeadless === true )
	) {
		await driverManager.acceptAllAlerts( driver );
	}
} );

saveConsoleLog();

// Update Sauce Job Status locally
afterEach( function () {
	const driver = global.__BROWSER__;

	if ( config.has( 'sauce' ) && config.get( 'sauce' ) ) {
		driver.allPassed = driver.allPassed && this.currentTest.state === 'passed';
	}
} );

// Stop video recording if the test has failed
afterEach( async function () {
	if ( this.currentTest && this.currentTest.state === 'failed' ) {
		await videoRecorder.stopVideo( this.currentTest );
	}
} );

// Push SauceLabs job status update (if applicable)
after( async function () {
	await this.timeout( afterHookTimeoutMS );
	const driver = global.__BROWSER__;

	if ( config.has( 'sauce' ) && config.get( 'sauce' ) ) {
		await driver.executeScript( 'sauce:job-result=' + driver.allPassed );
	}
} );

// Quit browser
after( function () {
	if ( ! global.__BROWSER__ ) {
		// Early return if there's no browser, i.e. when all specs were skipped.
		return;
	}

	this.timeout( afterHookTimeoutMS );
	const driver = global.__BROWSER__;

	if (
		( config.has( 'sauce' ) && config.get( 'sauce' ) ) ||
		config.get( 'closeBrowserOnComplete' ) === true ||
		global.isHeadless === true
	) {
		return driverManager.quitBrowser( driver );
	}
} );

// Stop video
after( async function () {
	await videoRecorder.stopVideo();
} );

// Stop xvfb display
after( async function () {
	await videoRecorder.stopDisplay();
} );
