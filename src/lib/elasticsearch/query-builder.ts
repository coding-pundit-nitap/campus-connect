import type { estypes } from "@elastic/elasticsearch";

type QueryDslQueryContainer = estypes.QueryDslQueryContainer;
type Sort = estypes.Sort;
type SortOrder = estypes.SortOrder;

interface RangeValue {
  gte?: number;
  lte?: number;
  gt?: number;
  lt?: number;
}

export class ESQueryBuilder {
  private must: QueryDslQueryContainer[] = [];
  private filter: QueryDslQueryContainer[] = [];
  private sort: estypes.SortCombinations[] = [];
  private _from: number = 0;
  private _size: number = 10;

  withTextSearch(
    query: string,
    fields: string[] = ["name^3", "description"]
  ): this {
    if (query && query.trim()) {
      this.must.push({
        multi_match: {
          query: query.trim(),
          fields,
          fuzziness: "AUTO",
        },
      });
    }
    return this;
  }

  withTerm<T extends string | number | boolean>(
    field: string,
    value: T | null | undefined
  ): this {
    if (value !== null && value !== undefined) {
      this.filter.push({
        term: { [field]: value },
      });
    }
    return this;
  }

  withRange(field: string, min?: number | null, max?: number | null): this {
    if (min !== null || max !== null) {
      const range: RangeValue = {};
      if (min !== undefined && min !== null) range.gte = min;
      if (max !== undefined && max !== null) range.lte = max;

      if (Object.keys(range).length > 0) {
        this.filter.push({
          range: { [field]: range },
        });
      }
    }
    return this;
  }

  withSort(field: string, order: SortOrder = "desc"): this {
    let sortField = field;
    if (field === "name") sortField = "name.keyword";

    (this.sort as Record<string, { order: SortOrder }>[]).push({
      [sortField]: { order },
    });
    return this;
  }

  withScoreSort(): this {
    (this.sort as string[]).push("_score");
    return this;
  }

  withPagination(page: number = 1, limit: number = 10): this {
    this._from = (page - 1) * limit;
    this._size = limit;
    return this;
  }

  build(): {
    query: QueryDslQueryContainer;
    sort: Sort;
    from: number;
    size: number;
  } {
    const mustClause = this.must.length > 0 ? this.must : [{ match_all: {} }];

    const sortClause =
      this.sort.length > 0
        ? this.sort
        : [{ created_at: { order: "desc" as SortOrder } }];

    return {
      query: {
        bool: {
          must: mustClause,
          filter: this.filter.length > 0 ? this.filter : undefined,
        },
      },
      sort: sortClause,
      from: this._from,
      size: this._size,
    };
  }
}

export function createQueryBuilder(): ESQueryBuilder {
  return new ESQueryBuilder();
}
