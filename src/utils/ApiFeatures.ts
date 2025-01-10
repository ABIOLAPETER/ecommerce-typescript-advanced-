import { Query } from 'mongoose';

interface QueryStr {
    [key: string]: any;
    limit?: string;
    sort?: string;
    fields?: string;
    page?: string;
    pageSize?: string;
}

export class ApiFeatures {
    query: Query<any, any>;
    queryStr: QueryStr;
    excludedFields: string[];

    constructor(query: Query<any, any>, queryStr: QueryStr) {
        this.query = query;
        this.queryStr = queryStr;
        this.excludedFields = ['limit', 'sort', 'fields', 'page', 'pageSize'];
    }

    filter() {
        const filteredQueryStr: QueryStr = {};

        Object.keys(this.queryStr).forEach(key => {
            if (!this.excludedFields.includes(key)) {
                filteredQueryStr[key] = this.queryStr[key];
            }
        });

        if (Object.keys(filteredQueryStr).length > 0) {
            let queryString = JSON.stringify(filteredQueryStr);
            queryString = queryString.replace(/(gte|gt|lte|lt)/g, (match) => `$${match}`);
            const queryObj = JSON.parse(queryString);

            console.log('Filtering with:', queryObj);
            this.query = this.query.find(queryObj);
        }
        return this;
    }

    sort() {
        if (this.queryStr.sort) {
            const sortBy = this.queryStr.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        if (this.queryStr.fields) {
            const fields = this.queryStr.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    paginate() {
        const limit = this.queryStr.limit ? parseInt(this.queryStr.limit, 10) : 100;
        const page = this.queryStr.page ? parseInt(this.queryStr.page, 10) : 1;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}
