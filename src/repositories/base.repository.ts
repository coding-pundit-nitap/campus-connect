/**
 * SCOPE HARDENING (security) - read before editing any scoped finder.
 *
 * Repository methods that take an id/owner and an `options` bag used to be
 * written as:
 *
 *     prisma.order.findMany({ where: { user_id }, ...options })
 *
 * Object spread applies `options` *after* the `where` key, so a
 * caller-supplied `options.where` REPLACED the scope wholesale instead of
 * merging with it. With `where: { status: undefined }` (Prisma treats
 * `undefined` as "no filter") that collapsed to `findMany({ where: {} })` -
 * every row in the table. This was live and exploitable on GET /api/orders.
 *
 * The declared option types (`Omit<XFindManyArgs, "where">`) did NOT stop it.
 * Two things have to line up, and in this codebase they both did:
 *
 *   1. The parameter is a *naked generic type parameter* (`options: T` where
 *      `T extends Omit<…, "where">`). Against a non-generic
 *      `options: Omit<…, "where">` parameter, full excess-property checking
 *      fires and `where` is rejected with TS2353.
 *   2. `Omit<XFindManyArgs, "where">` is a *weak type* - every property is
 *      optional. For a fresh literal inferred to a naked `T`, TypeScript
 *      applies only the weak-type common-property check, not a full
 *      excess-property check.
 *
 * The consequence is easy to miss: `f(id, { where })` on its own DOES still
 * error, because the literal shares no property with the constraint. Add any
 * one legitimate sibling - `take`, `skip`, `orderBy`, `select`, `include`,
 * `cursor` - and the whole literal, `where` included, sails through. The real
 * call site passed five of them. Do not conclude from a single red squiggle in
 * a scratch file that the type is enforcing anything.
 *
 * (Methods with no overload pair can and do close this properly, by declaring
 * `Omit<…, "where"> & { where?: never }` - not a naked generic, so full EPC
 * applies. See ProductRepository.hardDelete / getStockWatches /
 * getStockWatchersByProductId and ShopRepository.getFavoriteShops.)
 *
 * So the invariant is enforced at RUNTIME, in every scoped method:
 *
 *     const { where, ...rest } = options ?? {};
 *     prisma.order.findMany({ ...rest, where: { ...where, user_id } });
 *
 * `...rest` first (so take/skip/cursor/orderBy/select/include still work),
 * scope key LAST inside `where` (so a caller filter is ANDed in but can never
 * widen, drop, or redirect the scope).
 *
 * Note the ORDER inside `where` as well as outside it. Writing
 * `where: { scope, ...where }` - scope first - looks like a merge and is not:
 * a caller filter naming a scope key still overrides it. That variant was live
 * in ProductRepository.findManyByShopId and survived the first audit pass
 * precisely because the destructure above it looked correct.
 *
 * When adding a new scoped method, follow that shape. Do not write
 * `{ where: { scope }, ...options }` or `where: { scope, ...where }`.
 * Both shapes are enforced against by src/repositories/scope-hardening.test.ts,
 * which scans these sources - it will fail the build, not just review.
 */
export abstract class BaseRepository<
  TModel,
  TFindUniqueArgs,
  TFindManyArgs,
  TCreateArgs,
  TUpdateArgs,
  TDeleteArgs,
> {
  constructor(
    protected readonly delegate: {
      findUnique: (args: TFindUniqueArgs) => Promise<TModel | null>;
      findMany: (args?: TFindManyArgs) => Promise<TModel[]>;
      create: (args: TCreateArgs) => Promise<TModel>;
      update: (args: TUpdateArgs) => Promise<TModel>;
      delete: (args: TDeleteArgs) => Promise<TModel>;
    }
  ) {}

  async findUnique(args: TFindUniqueArgs): Promise<TModel | null> {
    return this.delegate.findUnique(args);
  }

  async findMany(args?: TFindManyArgs): Promise<TModel[]> {
    return this.delegate.findMany(args);
  }

  async create(args: TCreateArgs): Promise<TModel> {
    return this.delegate.create(args);
  }

  async update(args: TUpdateArgs): Promise<TModel> {
    return this.delegate.update(args);
  }

  async delete(args: TDeleteArgs): Promise<TModel> {
    return this.delegate.delete(args);
  }
}
