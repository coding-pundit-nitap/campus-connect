/**
 * SCOPE HARDENING (security) — read before editing any scoped finder.
 *
 * Repository methods that take an id/owner and an `options` bag used to be
 * written as:
 *
 *     prisma.order.findMany({ where: { user_id }, ...options })
 *
 * Object spread applies `options` *after* the `where` key, so a
 * caller-supplied `options.where` REPLACED the scope wholesale instead of
 * merging with it. With `where: { status: undefined }` (Prisma treats
 * `undefined` as "no filter") that collapsed to `findMany({ where: {} })` —
 * every row in the table. This was live and exploitable on GET /api/orders.
 *
 * The declared option types (`Omit<XFindManyArgs, "where">`) did NOT stop it.
 * TypeScript skips excess-property checking when a fresh object literal is
 * inferred to a *naked generic type parameter* (`options: T` where
 * `T extends Omit<…, "where">`): the literal's own type becomes `T`, and the
 * subsequent constraint check is an ordinary structural assignability check,
 * which permits extra properties. Confirmed empirically — the identical call
 * against a non-generic `options: Omit<…, "where">` parameter errors with
 * TS2353, the generic one compiles clean.
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
 * When adding a new scoped method, follow that shape. Do not write
 * `{ where: { scope }, ...options }`.
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
