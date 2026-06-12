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
