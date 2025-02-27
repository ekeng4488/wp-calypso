/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { identity } from 'lodash';

/**
 * Internal dependencies
 */
import StepWrapper from 'calypso/signup/step-wrapper';
import ValidationFieldset from 'calypso/signup/validation-fieldset';
import FormLabel from 'calypso/components/forms/form-label';
import FormTextInput from 'calypso/components/forms/form-text-input';
import LoggedOutForm from 'calypso/components/logged-out-form';
import LoggedOutFormFooter from 'calypso/components/logged-out-form/footer';
import { Button } from '@automattic/components';
import {
	createPasswordlessUser,
	verifyPasswordlessUser,
} from 'calypso/lib/signup/step-actions/passwordless';
import Notice from 'calypso/components/notice';
import { submitSignupStep } from 'calypso/state/signup/progress/actions';

export class PasswordlessStep extends Component {
	static propTypes = {
		flowName: PropTypes.string,
		translate: PropTypes.func,
	};

	static defaultProps = {
		translate: identity,
	};

	state = {
		code: '',
		email: '',
		errorMessages: null,
		noticeMessage: '',
		noticeStatus: '',
		submitting: false,
		showVerificationCode: false,
	};

	handleFieldChange = ( event ) => {
		const { name, value } = event.target;
		this.setState( {
			[ name ]: value,
			errorMessages: null,
		} );
	};

	createUser = ( event ) => {
		event.preventDefault();
		const data = { email: this.state.email };

		this.setState( {
			submitting: true,
		} );

		createPasswordlessUser( this.handleUserCreationRequest, data );
	};

	handleUserCreationRequest = ( error, response ) => {
		if ( error ) {
			this.setState( {
				errorMessages: [ error.message ],
				submitting: false,
			} );

			return;
		}

		this.setState( {
			errorMessages: null,
			noticeMessage: response && response.message,
			noticeStatus: response && response.warning ? 'is-warning' : 'is-info',
			showVerificationCode: true,
			submitting: false,
		} );
	};

	verifyUser = ( event ) => {
		event.preventDefault();
		this.setState( {
			errorMessages: null,
			submitting: true,
		} );

		verifyPasswordlessUser( this.handleUserVerificationRequest, {
			email: this.state.email,
			code: this.state.code,
		} );
	};

	handleUserVerificationRequest = ( error, providedDependencies ) => {
		if ( error ) {
			this.setState( {
				errorMessages: [ error && error.message ],
				submitting: false,
			} );

			return;
		}

		this.submitStep( providedDependencies );
	};

	submitStep = ( providedDependencies ) => {
		const { flowName, stepName } = this.props;

		this.props.submitSignupStep(
			{
				flowName,
				stepName,
			},
			providedDependencies
		);

		this.props.goToNextStep();
	};

	createUserButtonText() {
		const { translate } = this.props;

		if ( this.state.submitting ) {
			return translate( 'Creating your account…' );
		}

		return translate( 'Create your account' );
	}

	validateButtonText() {
		const { translate } = this.props;

		if ( this.state.submitting ) {
			return translate( 'Verifying your code…' );
		}

		return translate( 'Verify your code' );
	}

	renderNotice() {
		return (
			this.state.noticeMessage && (
				<Notice showDismiss={ false } status={ this.state.noticeStatus }>
					{ this.state.noticeMessage }
				</Notice>
			)
		);
	}

	renderVerificationForm() {
		return (
			<LoggedOutForm onSubmit={ this.verifyUser } noValidate>
				{ this.renderNotice() }
				<ValidationFieldset errorMessages={ this.state.errorMessages }>
					<FormLabel htmlFor="code">{ this.props.translate( 'Verification code' ) }</FormLabel>
					<FormTextInput
						autoCapitalize="off"
						className="passwordless__code"
						name="code"
						value={ this.state.code }
						onChange={ this.handleFieldChange }
						disabled={ this.state.submitting }
					/>
				</ValidationFieldset>
				<LoggedOutFormFooter>
					<Button
						type="submit"
						primary
						busy={ this.state.submitting }
						disabled={ this.state.submitting }
					>
						{ this.validateButtonText() }
					</Button>
				</LoggedOutFormFooter>
			</LoggedOutForm>
		);
	}

	renderSignupForm() {
		return (
			<LoggedOutForm onSubmit={ this.createUser } noValidate>
				{ this.renderNotice() }
				<ValidationFieldset errorMessages={ this.state.errorMessages }>
					<FormLabel htmlFor="email">{ this.props.translate( 'Email address' ) }</FormLabel>
					<FormTextInput
						autoCapitalize="off"
						className="passwordless__email"
						type="email"
						name="email"
						value={ this.state.email }
						onChange={ this.handleFieldChange }
						disabled={ this.state.submitting }
					/>
				</ValidationFieldset>
				<LoggedOutFormFooter>
					<Button
						type="submit"
						primary
						busy={ this.state.submitting }
						disabled={ this.state.submitting }
					>
						{ this.createUserButtonText() }
					</Button>
				</LoggedOutFormFooter>
			</LoggedOutForm>
		);
	}

	renderStepContent() {
		return this.state.showVerificationCode
			? this.renderVerificationForm()
			: this.renderSignupForm();
	}

	render() {
		return (
			<StepWrapper
				flowName={ this.props.flowName }
				stepName={ this.props.stepName }
				headerText={ this.props.headerText }
				subHeaderText={ this.props.translate( 'Create a WordPress.com account' ) }
				positionInFlow={ this.props.positionInFlow }
				stepContent={ this.renderStepContent() }
			/>
		);
	}
}

export default connect( null, { submitSignupStep } )( localize( PasswordlessStep ) );
