import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {
  elements,
  renderLoader,
  clearLoader
} from './views/base';

/**
 * - Search object
 * - Current recipe object
 * - Shoping list object
 * - Liked recipes
 */
const state = {}

/**
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
  // 1. Get a query from view
  const query = searchView.getInput();

  if (query) {
    // 2. New search object and add it to state
    state.search = new Search(query);

    // 3. Prepare UI for result
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    try {
      // 4. Search for recipes
      await state.search.getResult();

      // 5. Render results on UI
      clearLoader();
      searchView.renderResults(state.search.results);
    } catch (err) {
      alert('Recipes loading error');
      clearLoader();
    }
  }
}

elements.searchForm.addEventListener('submit', event => {
  event.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener('click', event => {
  const button = event.target.closest('.btn-inline');
  if (button) {
    const goToPage = parseInt(button.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.results, goToPage);
  }
});


/**
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
  // Get ID from url
  const id = window.location.hash.replace('#', '');

  if (id) {
    // Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    // Highlight selected search item
    if (state.search) {
      searchView.highlightedSeleceted(id);
    }

    // Create new recipe object
    state.recipe = new Recipe(id);

    try {
      // Get recipe data and parse ingredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      // Calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      // Render recipe
      clearLoader();
      recipeView.renderRecipe(
        state.recipe,
        state.likes.isLiked(id)
      );

    } catch (err) {
      alert('Error processing recipe');
    }
  }
}

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * LIST CONTROLLER
 */
const controlList = () => {
  // Create a new list if there is none yet
  if (!state.list) {
    state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
      const item = state.list.addItem(el.count, el.unit, el.ingredient);
      listView.renderItem(item);
    });
  }
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', event => {
  const id = event.target.closest('.shopping__item').dataset.itemid;

  // Handle the delete button
  if (event.target.matches('.shopping__delete, .shopping__delete *')) {
    // Delete from state
    state.list.deleteItem(id);

    // Delete from UI
    listView.deleteItem(id);

    // Handle the count update
  } else if (event.target.matches('.shopping__count-value')) {
    const val = parseFloat(event.target.value);
    state.list.updateCount(id, val);
  }
});


/**
 * LIKES CONTROLLER
 */

// TESTING

const controlLike = () => {

  if (!state.likes) {
    state.likes = new Likes();
  }
  const currentID = state.recipe.id;

  // user has not yet liked current recipe
  if (!state.likes.isLiked(currentID)) {
    // Add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    // Toggle the like button
    likesView.toggleLikeBtn(true);

    // Add like to UI list
    likesView.renderLike(newLike);

    // user has liked current recipe
  } else {
    // Remove like from the state
    state.likes.deleteLike(currentID);

    // Toggle the like button
    likesView.toggleLikeBtn(false);

    // Remove like from UI list
    likesView.deleteLike(currentID);

  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
}


// Restore liked recipes on page load
window.addEventListener('load', () => {
  state.likes = new Likes();

  // Restore likes
  state.likes.readStorage();

  // Toggle likes button
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  // Render the existing likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
})

// Handling recipe button clicks
elements.recipe.addEventListener('click', event => {

  if (event.target.matches('.btn-decrease, .btn-decrease *')) {
    // Decrease button is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings('dec');
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (event.target.matches('.btn-increase, .btn-increase *')) {
    // Increase button is clicked
    state.recipe.updateServings('inc');
    recipeView.updateServingsIngredients(state.recipe);
  } else if (event.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
    // Adding ingredients to shopping list
    controlList();
  } else if (event.target.matches('.recipe__love, .recipe__love *')) {
    // Like controller
    controlLike();
  }
});