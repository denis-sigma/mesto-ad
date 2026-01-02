import { setUserInfo, getCardList, getUserInfo, updateAvatar, addNewCard, deleteCardFromServer, changeLikeCardStatus } from "./components/api.js";
import { createCardElement, likeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const infoDefinitionTemplate = document.querySelector("#popup-info-definition-template").content;
const userPreviewTemplate = document.querySelector("#popup-info-user-preview-template").content;

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoModalTitle = cardInfoModalWindow.querySelector(".popup__title");
const cardInfoModalInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoModalText = cardInfoModalWindow.querySelector(".popup__text");
const cardInfoModalUserList = cardInfoModalWindow.querySelector(".popup__list");

let currentUserId = null;

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Сохранение...';
  
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Сохранение...';
  
  updateAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Создание...';
  submitButton.disabled = true;
  
  addNewCard(cardNameInput.value, cardLinkInput.value)
    .then((newCard) => {
      const cardElement = createCardElement(
        {
          name: newCard.name,
          link: newCard.link,
          likes: newCard.likes,
          ownerId: newCard.owner._id,
          currentUserId: currentUserId,
          id: newCard._id
        },
        {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: (likeButton) => {
            const isLiked = likeButton.classList.contains("card__like-button_is-active");
            likeButton.classList.toggle("card__like-button_is-active");
            
            const likeCount = cardElement.querySelector('.card__like-count');
            if (likeCount) {
              const currentLikes = parseInt(likeCount.textContent) || 0;
              likeCount.textContent = isLiked ? currentLikes - 1 : currentLikes + 1;
            }
            
            changeLikeCardStatus(newCard._id, isLiked)
              .then((updatedCard) => {
                const likeCount = cardElement.querySelector('.card__like-count');
                if (likeCount) {
                  likeCount.textContent = updatedCard.likes.length;
                }
              })
              .catch((err) => {
                console.log(err);
                likeButton.classList.toggle("card__like-button_is-active");
                const likeCount = cardElement.querySelector('.card__like-count');
                if (likeCount) {
                  likeCount.textContent = newCard.likes.length;
                }
              });
          },
          onDeleteCard: (cardElement) => {
            const deleteButton = cardElement.querySelector('.card__control-button_type_delete');
            if (deleteButton) {
              deleteButton.disabled = true;
            }
            
            deleteCardFromServer(newCard._id)
              .then(() => {
                cardElement.remove();
              })
              .catch((err) => {
                console.log(err);
                if (deleteButton) {
                  deleteButton.disabled = false;
                }
              });
          },
          onInfoClick: handleInfoClick,
        }
      );
      
      placesWrap.prepend(cardElement);
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    });
};

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const createInfoString = (term, description) => {
  const infoElement = infoDefinitionTemplate.querySelector('.popup__info-item').cloneNode(true);
  infoElement.querySelector('.popup__info-term').textContent = term;
  infoElement.querySelector('.popup__info-description').textContent = description;
  return infoElement;
};

const createUserBadge = (user) => {
  const userElement = document.createElement('li');
  userElement.className = 'popup__list-item popup__list-item_type_badge';
  
  userElement.textContent = user.name || 'Пользователь';
  
  return userElement;
};

const handleInfoClick = (cardId) => {
  cardInfoModalInfoList.innerHTML = "";
  cardInfoModalUserList.innerHTML = "";
  
  getCardList()
    .then((cards) => {
      const cardData = cards.find(card => card._id === cardId);
      
      if (!cardData) {
        console.error('Карточка не найдена');
        return;
      }
      
      cardInfoModalTitle.textContent = cardData.name;
      
      cardInfoModalInfoList.append(
        createInfoString(
          "Дата создания:",
          formatDate(new Date(cardData.createdAt))
        )
      );
      
      cardInfoModalInfoList.append(
        createInfoString(
          "Автор:",
          cardData.owner.name
        )
      );
      
      cardInfoModalInfoList.append(
        createInfoString(
          "Лайков:",
          cardData.likes.length.toString()
        )
      );
      
      if (cardData.likes.length > 0) {
        cardInfoModalText.textContent = "Лайкнули:";
        cardData.likes.forEach(user => {
          cardInfoModalUserList.append(createUserBadge(user));
        });
      } else {
        cardInfoModalText.textContent = "Пока никто не лайкнул";
      }
      
      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  openModalWindow(cardFormModalWindow);
});

const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

enableValidation(validationSettings);

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    
    currentUserId = userData._id;
    
    placesWrap.innerHTML = "";
    
    cards.forEach(cardData => {
      const isLikedByCurrentUser = cardData.likes && cardData.likes.some(like => like._id === userData._id);
      
      const cardElement = createCardElement(
        {
          name: cardData.name,
          link: cardData.link,
          likes: cardData.likes,
          ownerId: cardData.owner._id,
          currentUserId: currentUserId,
          id: cardData._id
        },
        {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: (likeButton) => {
            const isLiked = likeButton.classList.contains("card__like-button_is-active");
            likeButton.classList.toggle("card__like-button_is-active");
            
            const likeCount = cardElement.querySelector('.card__like-count');
            if (likeCount) {
              const currentLikes = parseInt(likeCount.textContent) || 0;
              likeCount.textContent = isLiked ? currentLikes - 1 : currentLikes + 1;
            }
            
            changeLikeCardStatus(cardData._id, isLiked)
              .then((updatedCard) => {
                const likeCount = cardElement.querySelector('.card__like-count');
                if (likeCount) {
                  likeCount.textContent = updatedCard.likes.length;
                }
              })
              .catch((err) => {
                console.log(err);
                likeButton.classList.toggle("card__like-button_is-active");
                const likeCount = cardElement.querySelector('.card__like-count');
                if (likeCount && cardData.likes) {
                  likeCount.textContent = cardData.likes.length;
                }
              });
          },
          onDeleteCard: (cardElement) => {
            const deleteButton = cardElement.querySelector('.card__control-button_type_delete');
            if (deleteButton) {
              deleteButton.disabled = true;
            }
            
            deleteCardFromServer(cardData._id)
              .then(() => {
                cardElement.remove();
              })
              .catch((err) => {
                console.log(err);
                if (deleteButton) {
                  deleteButton.disabled = false;
                }
              });
          },
          onInfoClick: handleInfoClick,
        }
      );
      
      if (isLikedByCurrentUser) {
        const likeButton = cardElement.querySelector('.card__like-button');
        if (likeButton) {
          likeButton.classList.add("card__like-button_is-active");
        }
      }
      
      placesWrap.append(cardElement);
    });
  })
  .catch((err) => {
    console.log(err);
  });