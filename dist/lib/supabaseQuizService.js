"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.enrichSingleSelectionQuestions = enrichSingleSelectionQuestions;
exports.enrichMultiChoiceQuestions = enrichMultiChoiceQuestions;
exports.enrichDragAndDropQuestions = enrichDragAndDropQuestions;
exports.enrichDropdownSelectionQuestions = enrichDropdownSelectionQuestions;
exports.enrichOrderQuestions = enrichOrderQuestions;
exports.enrichYesNoQuestions = enrichYesNoQuestions;
exports.enrichYesNoMultiQuestions = enrichYesNoMultiQuestions;
exports.groupQuestionsByType = groupQuestionsByType;
exports.enrichQuestionWithDetails = enrichQuestionWithDetails;
exports.fetchQuizById = fetchQuizById;
exports.fetchRandomQuestionByTypeAndFilters = fetchRandomQuestionByTypeAndFilters;
var supabase_js_1 = require("@supabase/supabase-js");
// Initialize Supabase client
// Using hardcoded values from .env file for debugging
var supabaseUrl = "https://rvwvnralrlsdtugtgict.supabase.co";
var supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2d3ZucmFscmxzZHR1Z3RnaWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQ0NzM0NCwiZXhwIjoyMDYxMDIzMzQ0fQ.hFRjn5zq24WmKEoCLbWDRUY6dUdEjlPS-c4OemCaFM4";
console.log('Supabase Environment Variables:');
console.log('URL:', supabaseUrl ? 'Defined' : 'Undefined');
console.log('Service Role Key:', supabaseServiceRoleKey ? 'Defined' : 'Undefined');
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false } // Recommended for server-side clients
});
function enrichQuestionWithDetails(baseQuestion) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, optionsData, optionsError, _b, correctAnswerData, correctAnswerError, typedOptions, correctAnswerOptionId, singleSelectionQuestion, error_1, _c, optionsData, optionsError, _d, correctAnswersData, correctAnswersError, typedOptions, correctAnswerOptionIds, multiChoiceQuestion, error_2, _e, targetsData, targetsError, _f, optionsData, optionsError, _g, correctPairsData, correctPairsError, typedTargets, typedOptions, typedCorrectPairs, dragAndDropQuestion, error_3, _h, optionsData, optionsError, _j, targetsData, targetsError, typedOptions, placeholderTargets_1, dropdownSelectionQuestion, error_4, _k, itemsData, itemsError, _l, correctOrderData, correctOrderError, items, correctOrder, orderQuestion, error_5, _m, correctAnswerData, correctAnswerError, yesNoQuestion, error_6, _o, statementsData, statementsError, _p, correctAnswersData_1, correctAnswersError, statements, correctAnswers, yesNoMultiQuestion, error_7;
        return __generator(this, function (_q) {
            switch (_q.label) {
                case 0:
                    if (!(baseQuestion.type === 'single_selection')) return [3 /*break*/, 6];
                    _q.label = 1;
                case 1:
                    _q.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, exports.supabase
                            .from('single_selection_options')
                            .select('option_id, text')
                            .eq('question_id', baseQuestion.id)];
                case 2:
                    _a = _q.sent(), optionsData = _a.data, optionsError = _a.error;
                    if (optionsError) {
                        console.error("Error fetching options for question ".concat(baseQuestion.id, ":"), optionsError.message);
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, exports.supabase
                            .from('single_selection_correct_answer')
                            .select('option_id')
                            .eq('question_id', baseQuestion.id)
                            .single()];
                case 3:
                    _b = _q.sent(), correctAnswerData = _b.data, correctAnswerError = _b.error;
                    if (correctAnswerError) {
                        // .single() throws an error if no row is found, or more than one is found.
                        // We can check the error code/details if needed, e.g. PostgrestError PGRST116 (0 rows)
                        if (correctAnswerError.code === 'PGRST116') {
                            console.warn("No correct answer found for single_selection question ".concat(baseQuestion.id, ". (PGRST116)"));
                        }
                        else {
                            console.error("Error fetching correct answer for question ".concat(baseQuestion.id, ":"), correctAnswerError.message);
                        }
                        return [2 /*return*/, null];
                    }
                    if (!correctAnswerData) { // Should be redundant if .single() succeeded, but good for safety
                        console.warn("No correct answer data returned for single_selection question ".concat(baseQuestion.id, " despite no error."));
                        return [2 /*return*/, null];
                    }
                    typedOptions = (optionsData || []).map(function (opt) { return ({
                        option_id: opt.option_id,
                        text: opt.text,
                    }); });
                    correctAnswerOptionId = correctAnswerData.option_id;
                    // It's possible optionsData is empty, which might be valid for a question under construction.
                    // However, a correct answer ID must exist.
                    if (!correctAnswerOptionId) {
                        console.warn("Correct answer option_id missing after fetch for single_selection question ".concat(baseQuestion.id));
                        return [2 /*return*/, null]; // Critical data missing
                    }
                    singleSelectionQuestion = __assign(__assign({}, baseQuestion), { type: 'single_selection', options: typedOptions, correctAnswerOptionId: correctAnswerOptionId });
                    return [2 /*return*/, singleSelectionQuestion];
                case 4:
                    error_1 = _q.sent();
                    console.error("Unexpected error enriching single_selection question ".concat(baseQuestion.id, ":"), error_1.message || error_1);
                    return [2 /*return*/, null];
                case 5: return [3 /*break*/, 43];
                case 6:
                    if (!(baseQuestion.type === 'multi')) return [3 /*break*/, 12];
                    _q.label = 7;
                case 7:
                    _q.trys.push([7, 10, , 11]);
                    return [4 /*yield*/, exports.supabase
                            .from('multi_options')
                            .select('option_id, text')
                            .eq('question_id', baseQuestion.id)];
                case 8:
                    _c = _q.sent(), optionsData = _c.data, optionsError = _c.error;
                    if (optionsError) {
                        console.error("Error fetching options for multi question ".concat(baseQuestion.id, ":"), optionsError.message);
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, exports.supabase
                            .from('multi_correct_answers')
                            .select('option_id')
                            .eq('question_id', baseQuestion.id)];
                case 9:
                    _d = _q.sent(), correctAnswersData = _d.data, correctAnswersError = _d.error;
                    if (correctAnswersError) {
                        console.error("Error fetching correct answers for multi question ".concat(baseQuestion.id, ":"), correctAnswersError.message);
                        return [2 /*return*/, null];
                    }
                    typedOptions = (optionsData || []).map(function (opt) { return ({
                        option_id: opt.option_id,
                        text: opt.text,
                    }); });
                    correctAnswerOptionIds = (correctAnswersData || []).map(function (ans) { return ans.option_id; });
                    if (!correctAnswerOptionIds.length) {
                        console.warn("No correct answer options found for multi question ".concat(baseQuestion.id));
                        return [2 /*return*/, null]; // Critical data missing
                    }
                    multiChoiceQuestion = __assign(__assign({}, baseQuestion), { type: 'multi', options: typedOptions, correctAnswerOptionIds: correctAnswerOptionIds });
                    return [2 /*return*/, multiChoiceQuestion];
                case 10:
                    error_2 = _q.sent();
                    console.error("Unexpected error enriching multi question ".concat(baseQuestion.id, ":"), error_2.message || error_2);
                    return [2 /*return*/, null];
                case 11: return [3 /*break*/, 43];
                case 12:
                    if (!(baseQuestion.type === 'drag_and_drop')) return [3 /*break*/, 19];
                    _q.label = 13;
                case 13:
                    _q.trys.push([13, 17, , 18]);
                    return [4 /*yield*/, exports.supabase
                            .from('drag_and_drop_targets')
                            .select('target_id, text')
                            .eq('question_id', baseQuestion.id)];
                case 14:
                    _e = _q.sent(), targetsData = _e.data, targetsError = _e.error;
                    if (targetsError) {
                        console.error("Error fetching targets for drag_and_drop question ".concat(baseQuestion.id, ":"), targetsError.message);
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, exports.supabase
                            .from('drag_and_drop_options')
                            .select('option_id, text')
                            .eq('question_id', baseQuestion.id)];
                case 15:
                    _f = _q.sent(), optionsData = _f.data, optionsError = _f.error;
                    if (optionsError) {
                        console.error("Error fetching options for drag_and_drop question ".concat(baseQuestion.id, ":"), optionsError.message);
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, exports.supabase
                            .from('drag_and_drop_correct_pairs')
                            .select('option_id, target_id')
                            .eq('question_id', baseQuestion.id)];
                case 16:
                    _g = _q.sent(), correctPairsData = _g.data, correctPairsError = _g.error;
                    if (correctPairsError) {
                        console.error("Error fetching correct pairs for drag_and_drop question ".concat(baseQuestion.id, ":"), correctPairsError.message);
                        return [2 /*return*/, null];
                    }
                    typedTargets = (targetsData || []).map(function (target) { return ({
                        target_id: target.target_id,
                        text: target.text,
                    }); });
                    typedOptions = (optionsData || []).map(function (option) { return ({
                        option_id: option.option_id,
                        text: option.text,
                    }); });
                    typedCorrectPairs = (correctPairsData || []).map(function (pair) { return ({
                        option_id: pair.option_id,
                        target_id: pair.target_id,
                    }); });
                    // Check if we have the minimum required data
                    if (!typedTargets.length) {
                        console.warn("No targets found for drag_and_drop question ".concat(baseQuestion.id));
                        return [2 /*return*/, null];
                    }
                    if (!typedOptions.length) {
                        console.warn("No options found for drag_and_drop question ".concat(baseQuestion.id));
                        return [2 /*return*/, null];
                    }
                    if (!typedCorrectPairs.length) {
                        console.warn("No correct pairs found for drag_and_drop question ".concat(baseQuestion.id));
                        return [2 /*return*/, null];
                    }
                    dragAndDropQuestion = __assign(__assign({}, baseQuestion), { type: 'drag_and_drop', targets: typedTargets, options: typedOptions, correctPairs: typedCorrectPairs });
                    return [2 /*return*/, dragAndDropQuestion];
                case 17:
                    error_3 = _q.sent();
                    console.error("Unexpected error enriching drag_and_drop question ".concat(baseQuestion.id, ":"), error_3.message || error_3);
                    return [2 /*return*/, null];
                case 18: return [3 /*break*/, 43];
                case 19:
                    if (!(baseQuestion.type === 'dropdown_selection')) return [3 /*break*/, 25];
                    _q.label = 20;
                case 20:
                    _q.trys.push([20, 23, , 24]);
                    return [4 /*yield*/, exports.supabase
                            .from('dropdown_selection_options')
                            .select('option_id, text, is_correct') // is_correct might be useful for some UI/logic
                            .eq('question_id', baseQuestion.id)];
                case 21:
                    _h = _q.sent(), optionsData = _h.data, optionsError = _h.error;
                    if (optionsError) {
                        console.error("Error fetching options for dropdown_selection question ".concat(baseQuestion.id, ":"), optionsError.message);
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, exports.supabase
                            .from('dropdown_selection_targets')
                            .select('key, value') // 'key' is the placeholder, 'value' is the correct option's text
                            .eq('question_id', baseQuestion.id)];
                case 22:
                    _j = _q.sent(), targetsData = _j.data, targetsError = _j.error;
                    if (targetsError) {
                        console.error("Error fetching targets for dropdown_selection question ".concat(baseQuestion.id, ":"), targetsError.message);
                        return [2 /*return*/, null];
                    }
                    typedOptions = (optionsData || []).map(function (opt) { return ({
                        option_id: opt.option_id,
                        text: opt.text,
                        is_correct: opt.is_correct, // Keep is_correct as it's in the table and type
                    }); });
                    placeholderTargets_1 = {};
                    (targetsData || []).forEach(function (target) {
                        placeholderTargets_1[target.key] = {
                            key: target.key,
                            correctOptionText: target.value,
                        };
                    });
                    if (!typedOptions.length) {
                        console.warn("No options found for dropdown_selection question ".concat(baseQuestion.id));
                        return [2 /*return*/, null]; // Critical: a dropdown question must have options
                    }
                    if (Object.keys(placeholderTargets_1).length === 0) {
                        console.warn("No placeholder targets found for dropdown_selection question ".concat(baseQuestion.id));
                        return [2 /*return*/, null]; // Critical: must have target mappings
                    }
                    dropdownSelectionQuestion = __assign(__assign({}, baseQuestion), { type: 'dropdown_selection', options: typedOptions, placeholderTargets: placeholderTargets_1 });
                    return [2 /*return*/, dropdownSelectionQuestion];
                case 23:
                    error_4 = _q.sent();
                    console.error("Unexpected error enriching dropdown_selection question ".concat(baseQuestion.id, ":"), error_4.message || error_4);
                    return [2 /*return*/, null];
                case 24: return [3 /*break*/, 43];
                case 25:
                    if (!(baseQuestion.type === 'order')) return [3 /*break*/, 31];
                    _q.label = 26;
                case 26:
                    _q.trys.push([26, 29, , 30]);
                    return [4 /*yield*/, exports.supabase
                            .from('order_items')
                            .select('item_id, text')
                            .eq('question_id', baseQuestion.id)];
                case 27:
                    _k = _q.sent(), itemsData = _k.data, itemsError = _k.error;
                    if (itemsError) {
                        console.error("Error fetching items for order question ".concat(baseQuestion.id, ":"), itemsError.message);
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, exports.supabase
                            .from('order_correct_order')
                            .select('item_id, position')
                            .eq('question_id', baseQuestion.id)
                            .order('position', { ascending: true })];
                case 28:
                    _l = _q.sent(), correctOrderData = _l.data, correctOrderError = _l.error;
                    if (correctOrderError) {
                        console.error("Error fetching correct order for question ".concat(baseQuestion.id, ":"), correctOrderError.message);
                        return [2 /*return*/, null];
                    }
                    items = (itemsData || []).map(function (item) { return ({
                        item_id: item.item_id,
                        text: item.text,
                    }); });
                    correctOrder = (correctOrderData || [])
                        .sort(function (a, b) { return a.position - b.position; })
                        .map(function (item) { return item.item_id; });
                    if (!items.length) {
                        console.warn("No items found for order question ".concat(baseQuestion.id));
                        return [2 /*return*/, null];
                    }
                    if (!correctOrder.length) {
                        console.warn("No correct order found for order question ".concat(baseQuestion.id));
                        return [2 /*return*/, null];
                    }
                    orderQuestion = __assign(__assign({}, baseQuestion), { type: 'order', items: items, correctOrder: correctOrder });
                    return [2 /*return*/, orderQuestion];
                case 29:
                    error_5 = _q.sent();
                    console.error("Unexpected error enriching order question ".concat(baseQuestion.id, ":"), error_5.message || error_5);
                    return [2 /*return*/, null];
                case 30: return [3 /*break*/, 43];
                case 31:
                    if (!(baseQuestion.type === 'yes_no')) return [3 /*break*/, 36];
                    _q.label = 32;
                case 32:
                    _q.trys.push([32, 34, , 35]);
                    return [4 /*yield*/, exports.supabase
                            .from('yes_no_answer')
                            .select('correct_answer')
                            .eq('question_id', baseQuestion.id)
                            .single()];
                case 33:
                    _m = _q.sent(), correctAnswerData = _m.data, correctAnswerError = _m.error;
                    if (correctAnswerError) {
                        if (correctAnswerError.code === 'PGRST116') {
                            console.warn("No correct answer found for yes_no question ".concat(baseQuestion.id, ". (PGRST116)"));
                        }
                        else {
                            console.error("Error fetching correct answer for yes_no question ".concat(baseQuestion.id, ":"), correctAnswerError.message);
                        }
                        return [2 /*return*/, null];
                    }
                    if (!correctAnswerData) {
                        console.warn("No correct answer data returned for yes_no question ".concat(baseQuestion.id, " despite no error."));
                        return [2 /*return*/, null];
                    }
                    yesNoQuestion = __assign(__assign({}, baseQuestion), { type: 'yes_no', correctAnswer: correctAnswerData.correct_answer });
                    return [2 /*return*/, yesNoQuestion];
                case 34:
                    error_6 = _q.sent();
                    console.error("Unexpected error enriching yes_no question ".concat(baseQuestion.id, ":"), error_6.message || error_6);
                    return [2 /*return*/, null];
                case 35: return [3 /*break*/, 43];
                case 36:
                    if (!(baseQuestion.type === 'yesno_multi')) return [3 /*break*/, 42];
                    _q.label = 37;
                case 37:
                    _q.trys.push([37, 40, , 41]);
                    return [4 /*yield*/, exports.supabase
                            .from('yesno_multi_statements')
                            .select('statement_id, text')
                            .eq('question_id', baseQuestion.id)];
                case 38:
                    _o = _q.sent(), statementsData = _o.data, statementsError = _o.error;
                    if (statementsError) {
                        console.error("Error fetching statements for yesno_multi question ".concat(baseQuestion.id, ":"), statementsError.message);
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, exports.supabase
                            .from('yesno_multi_correct_answers')
                            .select('statement_id, correct_answer')
                            .eq('question_id', baseQuestion.id)];
                case 39:
                    _p = _q.sent(), correctAnswersData_1 = _p.data, correctAnswersError = _p.error;
                    if (correctAnswersError) {
                        console.error("Error fetching correct answers for yesno_multi question ".concat(baseQuestion.id, ":"), correctAnswersError.message);
                        return [2 /*return*/, null];
                    }
                    statements = (statementsData || []).map(function (stmt) { return ({
                        statement_id: stmt.statement_id,
                        text: stmt.text,
                    }); });
                    // Sort the statements by statement_id to ensure the correct answers array matches
                    statements.sort(function (a, b) { return a.statement_id.localeCompare(b.statement_id); });
                    correctAnswers = statements.map(function (stmt) {
                        var matchingAnswer = correctAnswersData_1 === null || correctAnswersData_1 === void 0 ? void 0 : correctAnswersData_1.find(function (ans) { return ans.statement_id === stmt.statement_id; });
                        return matchingAnswer ? matchingAnswer.correct_answer : false;
                    });
                    if (!statements.length) {
                        console.warn("No statements found for yesno_multi question ".concat(baseQuestion.id));
                        return [2 /*return*/, null];
                    }
                    if (correctAnswers.length !== statements.length) {
                        console.warn("Mismatch between statements and correct answers for yesno_multi question ".concat(baseQuestion.id));
                        return [2 /*return*/, null];
                    }
                    yesNoMultiQuestion = __assign(__assign({}, baseQuestion), { type: 'yesno_multi', statements: statements, correctAnswers: correctAnswers });
                    return [2 /*return*/, yesNoMultiQuestion];
                case 40:
                    error_7 = _q.sent();
                    console.error("Unexpected error enriching yesno_multi question ".concat(baseQuestion.id, ":"), error_7.message || error_7);
                    return [2 /*return*/, null];
                case 41: return [3 /*break*/, 43];
                case 42:
                    console.warn("enrichQuestionWithDetails: Unhandled question type '".concat(baseQuestion.type, "' for Q ID ").concat(baseQuestion.id, ". Returning null."));
                    return [2 /*return*/, null];
                case 43: return [2 /*return*/];
            }
        });
    });
}
function fetchQuizById(quizId, questionType) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, quizData, quizError, query, _b, baseQuestionsData, questionsError, questionsByType, enrichmentPromises, enrichedQuestionArrays, allEnrichedQuestions, error_8;
        var _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    _k.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, exports.supabase
                            .from('quizzes')
                            .select('*')
                            .eq('id', quizId)
                            .single()];
                case 1:
                    _a = _k.sent(), quizData = _a.data, quizError = _a.error;
                    if (quizError) {
                        if (quizError.code === 'PGRST116') { // Not found
                            console.warn("Quiz with ID '".concat(quizId, "' not found."));
                        }
                        else {
                            console.error("Error fetching quiz ".concat(quizId, ":"), quizError.message);
                        }
                        return [2 /*return*/, null];
                    }
                    if (!quizData) {
                        console.warn("No data for quiz ".concat(quizId, " despite no error."));
                        return [2 /*return*/, null];
                    }
                    query = exports.supabase
                        .from('questions')
                        .select('*') // Select all base question fields
                        .eq('quiz_tag', quizId);
                    // Apply type filter if provided
                    if (questionType) {
                        query = query.eq('type', questionType);
                    }
                    return [4 /*yield*/, query];
                case 2:
                    _b = _k.sent(), baseQuestionsData = _b.data, questionsError = _b.error;
                    if (questionsError) {
                        console.error("Error fetching questions for quiz ".concat(quizId, ":"), questionsError.message);
                        return [2 /*return*/, null];
                    }
                    if (!baseQuestionsData || baseQuestionsData.length === 0) {
                        return [2 /*return*/, __assign(__assign({}, quizData), { questions: [] })];
                    }
                    questionsByType = groupQuestionsByType(baseQuestionsData);
                    enrichmentPromises = [];
                    // Process each question type in parallel
                    if ((_c = questionsByType['single_selection']) === null || _c === void 0 ? void 0 : _c.length) {
                        enrichmentPromises.push(enrichSingleSelectionQuestions(questionsByType['single_selection']));
                    }
                    if ((_d = questionsByType['multi']) === null || _d === void 0 ? void 0 : _d.length) {
                        enrichmentPromises.push(enrichMultiChoiceQuestions(questionsByType['multi']));
                    }
                    if ((_e = questionsByType['drag_and_drop']) === null || _e === void 0 ? void 0 : _e.length) {
                        enrichmentPromises.push(enrichDragAndDropQuestions(questionsByType['drag_and_drop']));
                    }
                    if ((_f = questionsByType['dropdown_selection']) === null || _f === void 0 ? void 0 : _f.length) {
                        enrichmentPromises.push(enrichDropdownSelectionQuestions(questionsByType['dropdown_selection']));
                    }
                    if ((_g = questionsByType['order']) === null || _g === void 0 ? void 0 : _g.length) {
                        enrichmentPromises.push(enrichOrderQuestions(questionsByType['order']));
                    }
                    if ((_h = questionsByType['yes_no']) === null || _h === void 0 ? void 0 : _h.length) {
                        enrichmentPromises.push(enrichYesNoQuestions(questionsByType['yes_no']));
                    }
                    if ((_j = questionsByType['yesno_multi']) === null || _j === void 0 ? void 0 : _j.length) {
                        enrichmentPromises.push(enrichYesNoMultiQuestions(questionsByType['yesno_multi']));
                    }
                    return [4 /*yield*/, Promise.all(enrichmentPromises)];
                case 3:
                    enrichedQuestionArrays = _k.sent();
                    allEnrichedQuestions = enrichedQuestionArrays.flat();
                    if (baseQuestionsData.length !== allEnrichedQuestions.length) {
                        console.warn("Not all questions for quiz ".concat(quizId, " could be successfully enriched."));
                    }
                    return [2 /*return*/, __assign(__assign({}, quizData), { questions: allEnrichedQuestions })];
                case 4:
                    error_8 = _k.sent();
                    console.error("Unexpected error in fetchQuizById for quiz ".concat(quizId, ":"), error_8.message || error_8);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// New function to fetch a random question by type and filters
function fetchRandomQuestionByTypeAndFilters(type, // Should be QuestionType, but using string for broader initial compatibility
filters) {
    return __awaiter(this, void 0, void 0, function () {
        var query, _a, baseQuestionsData, questionsError, randomIndex, randomBaseQuestion, error_9;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    query = exports.supabase
                        .from('questions')
                        .select('*')
                        .eq('type', type);
                    if (filters.difficulty && filters.difficulty !== 'all') {
                        query = query.eq('difficulty', filters.difficulty);
                    }
                    if (filters.tags && filters.tags.length > 0) {
                        // Assuming quiz_tag can be used for general tagging for now
                        // If you have a separate tags table or array column, this would need adjustment
                        query = query.in('quiz_tag', filters.tags);
                    }
                    // Fetch multiple to then pick one randomly, or use a database-specific random function
                    // For simplicity, fetching a few and picking the first one.
                    // For true randomness and performance on large datasets, a DB function like RANDOM() or TABLESAMPLE is better.
                    query = query.limit(10); // Fetch up to 10 matching questions
                    return [4 /*yield*/, query];
                case 1:
                    _a = _b.sent(), baseQuestionsData = _a.data, questionsError = _a.error;
                    if (questionsError) {
                        console.error("Error fetching questions by type ".concat(type, " and filters:"), questionsError.message);
                        return [2 /*return*/, null];
                    }
                    if (!baseQuestionsData || baseQuestionsData.length === 0) {
                        console.warn("No questions found for type ".concat(type, " with current filters."));
                        return [2 /*return*/, null];
                    }
                    randomIndex = Math.floor(Math.random() * baseQuestionsData.length);
                    randomBaseQuestion = baseQuestionsData[randomIndex];
                    if (!randomBaseQuestion) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, enrichQuestionWithDetails(randomBaseQuestion)];
                case 2: 
                // Enrich the selected base question with its specific details
                return [2 /*return*/, _b.sent()];
                case 3:
                    error_9 = _b.sent();
                    console.error("Unexpected error in fetchRandomQuestionByTypeAndFilters for type ".concat(type, ":"), error_9.message || error_9);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Helper to group questions by type
function groupQuestionsByType(baseQuestions) {
    return baseQuestions.reduce(function (acc, q) {
        if (!acc[q.type]) {
            acc[q.type] = [];
        }
        acc[q.type].push(q);
        return acc;
    }, {});
}
// Batch fetch for single selection questions
function enrichSingleSelectionQuestions(questions) {
    return __awaiter(this, void 0, void 0, function () {
        var questionIds, _a, optionsData, optionsError, _b, correctAnswersData, correctAnswersError, optionsByQuestion_1, correctAnswerMap_1, error_10;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!questions.length)
                        return [2 /*return*/, []];
                    questionIds = questions.map(function (q) { return q.id; });
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, exports.supabase
                            .from('single_selection_options')
                            .select('option_id, text, question_id')
                            .in('question_id', questionIds)];
                case 2:
                    _a = _c.sent(), optionsData = _a.data, optionsError = _a.error;
                    if (optionsError) {
                        console.error('Error fetching single selection options:', optionsError.message);
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, exports.supabase
                            .from('single_selection_correct_answer')
                            .select('option_id, question_id')
                            .in('question_id', questionIds)];
                case 3:
                    _b = _c.sent(), correctAnswersData = _b.data, correctAnswersError = _b.error;
                    if (correctAnswersError) {
                        console.error('Error fetching single selection correct answers:', correctAnswersError.message);
                        return [2 /*return*/, []];
                    }
                    optionsByQuestion_1 = (optionsData === null || optionsData === void 0 ? void 0 : optionsData.reduce(function (acc, opt) {
                        if (!acc[opt.question_id]) {
                            acc[opt.question_id] = [];
                        }
                        acc[opt.question_id].push({
                            option_id: opt.option_id,
                            text: opt.text,
                        });
                        return acc;
                    }, {})) || {};
                    correctAnswerMap_1 = (correctAnswersData === null || correctAnswersData === void 0 ? void 0 : correctAnswersData.reduce(function (acc, ans) {
                        acc[ans.question_id] = ans.option_id;
                        return acc;
                    }, {})) || {};
                    // Build enriched questions
                    return [2 /*return*/, questions.map(function (q) {
                            var options = optionsByQuestion_1[q.id] || [];
                            var correctAnswerId = correctAnswerMap_1[q.id];
                            if (!options.length || !correctAnswerId) {
                                console.warn("Incomplete data for single selection question ".concat(q.id));
                                return null;
                            }
                            return __assign(__assign({}, q), { type: 'single_selection', options: options, correctAnswerOptionId: correctAnswerId });
                        }).filter(function (q) { return q !== null; })];
                case 4:
                    error_10 = _c.sent();
                    console.error('Error in enrichSingleSelectionQuestions:', error_10.message);
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Batch fetch for multi choice questions
function enrichMultiChoiceQuestions(questions) {
    return __awaiter(this, void 0, void 0, function () {
        var questionIds, _a, optionsData, optionsError, _b, correctAnswersData, correctAnswersError, optionsByQuestion_2, correctAnswersByQuestion_1, error_11;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!questions.length)
                        return [2 /*return*/, []];
                    questionIds = questions.map(function (q) { return q.id; });
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, exports.supabase
                            .from('multi_options')
                            .select('option_id, text, question_id')
                            .in('question_id', questionIds)];
                case 2:
                    _a = _c.sent(), optionsData = _a.data, optionsError = _a.error;
                    if (optionsError) {
                        console.error('Error fetching multi choice options:', optionsError.message);
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, exports.supabase
                            .from('multi_correct_answers')
                            .select('option_id, question_id')
                            .in('question_id', questionIds)];
                case 3:
                    _b = _c.sent(), correctAnswersData = _b.data, correctAnswersError = _b.error;
                    if (correctAnswersError) {
                        console.error('Error fetching multi choice correct answers:', correctAnswersError.message);
                        return [2 /*return*/, []];
                    }
                    optionsByQuestion_2 = (optionsData === null || optionsData === void 0 ? void 0 : optionsData.reduce(function (acc, opt) {
                        if (!acc[opt.question_id]) {
                            acc[opt.question_id] = [];
                        }
                        acc[opt.question_id].push({
                            option_id: opt.option_id,
                            text: opt.text,
                        });
                        return acc;
                    }, {})) || {};
                    correctAnswersByQuestion_1 = (correctAnswersData === null || correctAnswersData === void 0 ? void 0 : correctAnswersData.reduce(function (acc, ans) {
                        if (!acc[ans.question_id]) {
                            acc[ans.question_id] = [];
                        }
                        acc[ans.question_id].push(ans.option_id);
                        return acc;
                    }, {})) || {};
                    // Build enriched questions
                    return [2 /*return*/, questions.map(function (q) {
                            var options = optionsByQuestion_2[q.id] || [];
                            var correctAnswerIds = correctAnswersByQuestion_1[q.id] || [];
                            if (!options.length || !correctAnswerIds.length) {
                                console.warn("Incomplete data for multi choice question ".concat(q.id));
                                return null;
                            }
                            return __assign(__assign({}, q), { type: 'multi', options: options, correctAnswerOptionIds: correctAnswerIds });
                        }).filter(function (q) { return q !== null; })];
                case 4:
                    error_11 = _c.sent();
                    console.error('Error in enrichMultiChoiceQuestions:', error_11.message);
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Batch fetch for drag and drop questions
function enrichDragAndDropQuestions(questions) {
    return __awaiter(this, void 0, void 0, function () {
        var questionIds, _a, targetsResult, optionsResult, correctPairsResult, targetsByQuestion_1, optionsByQuestion_3, correctPairsByQuestion_1, error_12;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!questions.length)
                        return [2 /*return*/, []];
                    questionIds = questions.map(function (q) { return q.id; });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.all([
                            exports.supabase
                                .from('drag_and_drop_targets')
                                .select('target_id, text, question_id')
                                .in('question_id', questionIds),
                            exports.supabase
                                .from('drag_and_drop_options')
                                .select('option_id, text, question_id')
                                .in('question_id', questionIds),
                            exports.supabase
                                .from('drag_and_drop_correct_pairs')
                                .select('option_id, target_id, question_id')
                                .in('question_id', questionIds)
                        ])];
                case 2:
                    _a = _b.sent(), targetsResult = _a[0], optionsResult = _a[1], correctPairsResult = _a[2];
                    if (targetsResult.error) {
                        console.error('Error fetching drag and drop targets:', targetsResult.error.message);
                        return [2 /*return*/, []];
                    }
                    if (optionsResult.error) {
                        console.error('Error fetching drag and drop options:', optionsResult.error.message);
                        return [2 /*return*/, []];
                    }
                    if (correctPairsResult.error) {
                        console.error('Error fetching drag and drop correct pairs:', correctPairsResult.error.message);
                        return [2 /*return*/, []];
                    }
                    targetsByQuestion_1 = (targetsResult.data || []).reduce(function (acc, target) {
                        if (!acc[target.question_id]) {
                            acc[target.question_id] = [];
                        }
                        acc[target.question_id].push({
                            target_id: target.target_id,
                            text: target.text,
                        });
                        return acc;
                    }, {});
                    optionsByQuestion_3 = (optionsResult.data || []).reduce(function (acc, option) {
                        if (!acc[option.question_id]) {
                            acc[option.question_id] = [];
                        }
                        acc[option.question_id].push({
                            option_id: option.option_id,
                            text: option.text,
                        });
                        return acc;
                    }, {});
                    correctPairsByQuestion_1 = (correctPairsResult.data || []).reduce(function (acc, pair) {
                        if (!acc[pair.question_id]) {
                            acc[pair.question_id] = [];
                        }
                        acc[pair.question_id].push({
                            option_id: pair.option_id,
                            target_id: pair.target_id,
                        });
                        return acc;
                    }, {});
                    // Build enriched questions
                    return [2 /*return*/, questions.map(function (q) {
                            var targets = targetsByQuestion_1[q.id] || [];
                            var options = optionsByQuestion_3[q.id] || [];
                            var correctPairs = correctPairsByQuestion_1[q.id] || [];
                            if (!targets.length || !options.length || !correctPairs.length) {
                                console.warn("Incomplete data for drag and drop question ".concat(q.id));
                                return null;
                            }
                            return __assign(__assign({}, q), { type: 'drag_and_drop', targets: targets, options: options, correctPairs: correctPairs });
                        }).filter(function (q) { return q !== null; })];
                case 3:
                    error_12 = _b.sent();
                    console.error('Error in enrichDragAndDropQuestions:', error_12.message);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Batch fetch for dropdown selection questions
function enrichDropdownSelectionQuestions(questions) {
    return __awaiter(this, void 0, void 0, function () {
        var questionIds, _a, optionsResult, targetsResult, optionsByQuestion_4, targetsByQuestion_2, error_13;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!questions.length)
                        return [2 /*return*/, []];
                    questionIds = questions.map(function (q) { return q.id; });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.all([
                            exports.supabase
                                .from('dropdown_selection_options')
                                .select('option_id, text, is_correct, question_id')
                                .in('question_id', questionIds),
                            exports.supabase
                                .from('dropdown_selection_targets')
                                .select('key, value, question_id')
                                .in('question_id', questionIds)
                        ])];
                case 2:
                    _a = _b.sent(), optionsResult = _a[0], targetsResult = _a[1];
                    if (optionsResult.error) {
                        console.error('Error fetching dropdown selection options:', optionsResult.error.message);
                        return [2 /*return*/, []];
                    }
                    if (targetsResult.error) {
                        console.error('Error fetching dropdown selection targets:', targetsResult.error.message);
                        return [2 /*return*/, []];
                    }
                    optionsByQuestion_4 = (optionsResult.data || []).reduce(function (acc, opt) {
                        if (!acc[opt.question_id]) {
                            acc[opt.question_id] = [];
                        }
                        acc[opt.question_id].push({
                            option_id: opt.option_id,
                            text: opt.text,
                            is_correct: opt.is_correct,
                        });
                        return acc;
                    }, {});
                    targetsByQuestion_2 = (targetsResult.data || []).reduce(function (acc, target) {
                        if (!acc[target.question_id]) {
                            acc[target.question_id] = {};
                        }
                        acc[target.question_id][target.key] = {
                            key: target.key,
                            correctOptionText: target.value,
                        };
                        return acc;
                    }, {});
                    // Build enriched questions
                    return [2 /*return*/, questions.map(function (q) {
                            var options = optionsByQuestion_4[q.id] || [];
                            var placeholderTargets = targetsByQuestion_2[q.id] || {};
                            if (!options.length || Object.keys(placeholderTargets).length === 0) {
                                console.warn("Incomplete data for dropdown selection question ".concat(q.id));
                                return null;
                            }
                            return __assign(__assign({}, q), { type: 'dropdown_selection', options: options, placeholderTargets: placeholderTargets });
                        }).filter(function (q) { return q !== null; })];
                case 3:
                    error_13 = _b.sent();
                    console.error('Error in enrichDropdownSelectionQuestions:', error_13.message);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Batch fetch for order questions
function enrichOrderQuestions(questions) {
    return __awaiter(this, void 0, void 0, function () {
        var questionIds, _a, itemsResult, correctOrderResult, itemsByQuestion_1, correctOrderByQuestion, questionId, sortedCorrectOrderByQuestion_1, error_14;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!questions.length)
                        return [2 /*return*/, []];
                    questionIds = questions.map(function (q) { return q.id; });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.all([
                            exports.supabase
                                .from('order_items')
                                .select('item_id, text, question_id')
                                .in('question_id', questionIds),
                            exports.supabase
                                .from('order_correct_order')
                                .select('item_id, position, question_id')
                                .in('question_id', questionIds)
                        ])];
                case 2:
                    _a = _b.sent(), itemsResult = _a[0], correctOrderResult = _a[1];
                    if (itemsResult.error) {
                        console.error('Error fetching order items:', itemsResult.error.message);
                        return [2 /*return*/, []];
                    }
                    if (correctOrderResult.error) {
                        console.error('Error fetching order correct sequence:', correctOrderResult.error.message);
                        return [2 /*return*/, []];
                    }
                    itemsByQuestion_1 = (itemsResult.data || []).reduce(function (acc, item) {
                        if (!acc[item.question_id]) {
                            acc[item.question_id] = [];
                        }
                        acc[item.question_id].push({
                            item_id: item.item_id,
                            text: item.text,
                        });
                        return acc;
                    }, {});
                    correctOrderByQuestion = (correctOrderResult.data || []).reduce(function (acc, order) {
                        if (!acc[order.question_id]) {
                            acc[order.question_id] = [];
                        }
                        acc[order.question_id].push({
                            item_id: order.item_id,
                            position: order.position,
                        });
                        return acc;
                    }, {});
                    // Sort the correct order arrays by position and extract item_ids
                    for (questionId in correctOrderByQuestion) {
                        correctOrderByQuestion[questionId].sort(function (a, b) { return a.position - b.position; });
                    }
                    sortedCorrectOrderByQuestion_1 = Object.fromEntries(Object.entries(correctOrderByQuestion).map(function (_a) {
                        var questionId = _a[0], orderArray = _a[1];
                        return [
                            questionId,
                            orderArray.map(function (item) { return item.item_id; })
                        ];
                    }));
                    // Build enriched questions
                    return [2 /*return*/, questions.map(function (q) {
                            var items = itemsByQuestion_1[q.id] || [];
                            var correctOrder = sortedCorrectOrderByQuestion_1[q.id] || [];
                            if (!items.length || !correctOrder.length) {
                                console.warn("Incomplete data for order question ".concat(q.id));
                                return null;
                            }
                            return __assign(__assign({}, q), { type: 'order', items: items, correctOrder: correctOrder });
                        }).filter(function (q) { return q !== null; })];
                case 3:
                    error_14 = _b.sent();
                    console.error('Error in enrichOrderQuestions:', error_14.message);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Batch fetch for yes/no questions
function enrichYesNoQuestions(questions) {
    return __awaiter(this, void 0, void 0, function () {
        var questionIds, _a, correctAnswersData, correctAnswersError, correctAnswerMap_2, error_15;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!questions.length)
                        return [2 /*return*/, []];
                    questionIds = questions.map(function (q) { return q.id; });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, exports.supabase
                            .from('yes_no_answer')
                            .select('question_id, correct_answer')
                            .in('question_id', questionIds)];
                case 2:
                    _a = _b.sent(), correctAnswersData = _a.data, correctAnswersError = _a.error;
                    if (correctAnswersError) {
                        console.error('Error fetching yes/no answers:', correctAnswersError.message);
                        return [2 /*return*/, []];
                    }
                    correctAnswerMap_2 = (correctAnswersData || []).reduce(function (acc, ans) {
                        acc[ans.question_id] = ans.correct_answer;
                        return acc;
                    }, {});
                    // Build enriched questions
                    return [2 /*return*/, questions.map(function (q) {
                            var correctAnswer = correctAnswerMap_2[q.id];
                            if (correctAnswer === undefined) {
                                console.warn("No correct answer found for yes/no question ".concat(q.id));
                                return null;
                            }
                            return __assign(__assign({}, q), { type: 'yes_no', correctAnswer: correctAnswer });
                        }).filter(function (q) { return q !== null; })];
                case 3:
                    error_15 = _b.sent();
                    console.error('Error in enrichYesNoQuestions:', error_15.message);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Batch fetch for yes/no multi questions
function enrichYesNoMultiQuestions(questions) {
    return __awaiter(this, void 0, void 0, function () {
        var questionIds, _a, statementsResult, correctAnswersResult, statementsByQuestion_1, correctAnswersByQuestion_2, error_16;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!questions.length)
                        return [2 /*return*/, []];
                    questionIds = questions.map(function (q) { return q.id; });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.all([
                            exports.supabase
                                .from('yesno_multi_statements')
                                .select('statement_id, text, question_id')
                                .in('question_id', questionIds),
                            exports.supabase
                                .from('yesno_multi_correct_answers')
                                .select('statement_id, correct_answer, question_id')
                                .in('question_id', questionIds)
                        ])];
                case 2:
                    _a = _b.sent(), statementsResult = _a[0], correctAnswersResult = _a[1];
                    if (statementsResult.error) {
                        console.error('Error fetching yesno_multi statements:', statementsResult.error.message);
                        return [2 /*return*/, []];
                    }
                    if (correctAnswersResult.error) {
                        console.error('Error fetching yesno_multi correct answers:', correctAnswersResult.error.message);
                        return [2 /*return*/, []];
                    }
                    statementsByQuestion_1 = (statementsResult.data || []).reduce(function (acc, stmt) {
                        if (!acc[stmt.question_id]) {
                            acc[stmt.question_id] = [];
                        }
                        acc[stmt.question_id].push({
                            statement_id: stmt.statement_id,
                            text: stmt.text,
                        });
                        return acc;
                    }, {});
                    correctAnswersByQuestion_2 = (correctAnswersResult.data || []).reduce(function (acc, ans) {
                        if (!acc[ans.question_id]) {
                            acc[ans.question_id] = new Map();
                        }
                        acc[ans.question_id].set(ans.statement_id, ans.correct_answer);
                        return acc;
                    }, {});
                    // Build enriched questions
                    return [2 /*return*/, questions.map(function (q) {
                            var statements = statementsByQuestion_1[q.id] || [];
                            var correctAnswersMap = correctAnswersByQuestion_2[q.id];
                            if (!statements.length || !correctAnswersMap) {
                                console.warn("Incomplete data for yesno_multi question ".concat(q.id));
                                return null;
                            }
                            // Sort statements by statement_id
                            statements.sort(function (a, b) { return a.statement_id.localeCompare(b.statement_id); });
                            // Create the correctAnswers array matching the statements order
                            var correctAnswers = statements.map(function (stmt) {
                                return correctAnswersMap.get(stmt.statement_id) || false;
                            });
                            if (correctAnswers.length !== statements.length) {
                                console.warn("Mismatch between statements and correct answers for yesno_multi question ".concat(q.id));
                                return null;
                            }
                            return __assign(__assign({}, q), { type: 'yesno_multi', statements: statements, correctAnswers: correctAnswers });
                        }).filter(function (q) { return q !== null; })];
                case 3:
                    error_16 = _b.sent();
                    console.error('Error in enrichYesNoMultiQuestions:', error_16.message);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
