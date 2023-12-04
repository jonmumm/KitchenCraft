import { Observable, filter, map, takeWhile } from "rxjs";
import { Recipe } from "../../../db/types";

export const getObservables = (recipe$: Observable<Partial<Recipe>>) => ({
  name$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.description === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (item: Partial<Recipe>): item is Partial<Recipe> & { name: string } =>
        item.name !== undefined
    ),
    map((item) => item.name)
  ),
  description$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.tags === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (
        item: Partial<Recipe>
      ): item is Partial<Recipe> & { description: string } =>
        item.description !== undefined
    ),
    map((item) => item.description)
  ),
  ingredients$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.instructions === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (
        item: Partial<Recipe>
      ): item is Partial<Recipe> & { ingredients: string[] } =>
        item.ingredients !== undefined && Array.isArray(item.ingredients)
    ),
    map((item) => item.ingredients)
  ),
  instructions$: recipe$.pipe(
    filter(
      (
        item: Partial<Recipe>
      ): item is Partial<Recipe> & { instructions: string[] } =>
        item.instructions !== undefined && Array.isArray(item.instructions)
    ),
    map((item) => item.instructions)
  ),
  yield$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.tags === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (item: Partial<Recipe>): item is Partial<Recipe> & { yield: string } =>
        item.yield !== undefined
    ),
    map((item) => item.yield)
  ),
  tags$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.ingredients === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (item: Partial<Recipe>): item is Partial<Recipe> & { tags: string[] } =>
        item.tags !== undefined && Array.isArray(item.tags)
    ),
    map((item) => item.tags)
  ),
  activeTime$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.tags === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (
        item: Partial<Recipe>
      ): item is Partial<Recipe> & { activeTime: string } =>
        item.activeTime !== undefined
    ),
    map((item) => item.activeTime)
  ),
  cookTime$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.tags === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (item: Partial<Recipe>): item is Partial<Recipe> & { cookTime: string } =>
        item.cookTime !== undefined
    ),
    map((item) => item.cookTime)
  ),
  totalTime$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.tags === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (
        item: Partial<Recipe>
      ): item is Partial<Recipe> & { totalTime: string } =>
        item.totalTime !== undefined
    ),
    map((item) => item.totalTime)
  ),
});
