const getFormsForLanguage = require( "../helpers/getFormsForLanguage.js" )();
const getWords = require( "../stringProcessing/getWords.js" );
const getLanguage = require( "../helpers/getLanguage.js" );
const getFunctionWords = require( "../helpers/getFunctionWords.js" )();

const includes = require( "lodash/includes" );
const filter = require( "lodash/filter" );
const isUndefined = require( "lodash/isUndefined" );
const escapeRegExp = require( "lodash/escapeRegExp" );

/**
 * Analyzes the focus keyword string. Checks if morphology is requested or if the user wants to match exact string.
 * If morphology is required the module builds all word forms for all content words (prepositions, articles, conjunctions).
 *
 * @param {Object} paper The paper to analyze keyword forms for.
 *
 * @returns {Array} Array of all forms to be searched for keyword-based assessments.
 */

module.exports = function( paper ) {
	let keyword = paper.getKeyword();
	const language = getLanguage( paper.getLocale() );
	const getForms = getFormsForLanguage[ language ];

	// If the language is not yet supported with respect to morphological analysis, return keyword itself.
	if ( isUndefined( getForms ) ) {
		// console.log( "Requested word forms for a language without morphological support, returning keyword itself.", keyword );
		return [].concat( keyword );
	}

	// If the keyword is embedded in double quotation marks, return keyword itself, without outer-most quotation marks.
	if ( keyword[ 0 ] === "\"" && keyword[ keyword.length - 1 ] === "\"" ) {
		// console.log( "Requested exact match, returning keyword itself.", keyword.substring( 1, keyword.length - 1 ) );
		return [].concat( keyword.substring( 1, keyword.length - 1 ) );
	}

	let forms = [];

	// If the keyword is a single word return all its possible forms.
	if ( keyword.indexOf( " " ) === -1 ) {
		// console.log( "Keyword is one word, returning  all forms of this keyword. ", getForms( escapeRegExp( keyword ) ) );
		const wordToLowerCase = escapeRegExp( keyword.toLocaleLowerCase() );
		forms = forms.concat( getForms( wordToLowerCase ) );
		return forms;
	}

	// If the keyword contains multiple words first filter all function words out, then build all possible forms for remaining contents words.
	const keyWords = getWords( keyword );
	const functionWords = getFunctionWords[ language ].all;

	const keyWordsFiltered = filter( keyWords, function( word ) {
		return ( ! includes( functionWords, word.trim().toLocaleLowerCase() ) );
	} );

	// If after filtering there is nothing left, return all forms of all words, because apparently we were too harsh with filtering.
	if ( keyWordsFiltered.length === 0 ) {
		keyWords.forEach( function( word ) {
			const wordToLowerCase = escapeRegExp( word.toLocaleLowerCase() );
			forms = forms.concat( getForms( wordToLowerCase ) );
		} );
		// console.log( "Keyphrase only contains functionWords, return all forms of every word in the keyphrase. ", forms );
		return forms;
	}

	// If after filtering function words out there are still words remaining, build all forms for each of them and return in one array.
	keyWordsFiltered.forEach( function( word ) {
		const wordToLowerCase = escapeRegExp( word.toLocaleLowerCase() );
		forms = forms.concat( getForms( wordToLowerCase ) );
	} );
	// console.log( "Keyphrase contains content words, return all forms of every content word in the keyphrase. ", forms );
	return forms;
};
