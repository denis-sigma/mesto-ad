function checkInputValidity(formElement, inputElement, settings) {
  if (inputElement.validity.patternMismatch && inputElement.dataset.errorMessage) {
    inputElement.setCustomValidity(inputElement.dataset.errorMessage);
  } else {
    inputElement.setCustomValidity('');
  }

  if (!inputElement.validity.valid) {
    showInputError(formElement, inputElement, settings);
  } else {
    hideInputError(formElement, inputElement, settings);
  }
}

function showInputError(formElement, inputElement, settings) {
  const errorElement = formElement.querySelector(`#${inputElement.id}-error`);
  inputElement.classList.add(settings.inputErrorClass);
  errorElement.textContent = inputElement.validationMessage;
  errorElement.classList.add(settings.errorClass);
}

function hideInputError(formElement, inputElement, settings) {
  const errorElement = formElement.querySelector(`#${inputElement.id}-error`);
  inputElement.classList.remove(settings.inputErrorClass);
  errorElement.textContent = '';
  errorElement.classList.remove(settings.errorClass);
}

function hasInvalidInput(inputList) {
  return inputList.some(inputElement => !inputElement.validity.valid);
}

function disableSubmitButton(buttonElement, settings) {
  buttonElement.classList.add(settings.inactiveButtonClass);
  buttonElement.disabled = true;
}

function enableSubmitButton(buttonElement, settings) {
  buttonElement.classList.remove(settings.inactiveButtonClass);
  buttonElement.disabled = false;
}

function toggleButtonState(inputList, buttonElement, settings) {
  if (hasInvalidInput(inputList)) {
    disableSubmitButton(buttonElement, settings);
  } else {
    enableSubmitButton(buttonElement, settings);
  }
}

function setEventListeners(formElement, settings) {
  const inputList = Array.from(formElement.querySelectorAll(settings.inputSelector));
  const buttonElement = formElement.querySelector(settings.submitButtonSelector);

  toggleButtonState(inputList, buttonElement, settings);

  inputList.forEach(inputElement => {
    inputElement.addEventListener('input', () => {
      checkInputValidity(formElement, inputElement, settings);
      toggleButtonState(inputList, buttonElement, settings);
    });
  });
}

function clearValidation(formElement, settings) {
  const inputList = Array.from(formElement.querySelectorAll(settings.inputSelector));
  const buttonElement = formElement.querySelector(settings.submitButtonSelector);

  inputList.forEach(inputElement => hideInputError(formElement, inputElement, settings));
  disableSubmitButton(buttonElement, settings);
}

function enableValidation(settings) {
  const formList = Array.from(document.querySelectorAll(settings.formSelector));
  formList.forEach(formElement => {
    setEventListeners(formElement, settings);
  });
}

export { enableValidation, clearValidation };