const { PAGINATION } = require('../constants');

class QueryService {
  static buildPagination (query) {
    const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    return {
      page,
      limit,
      skip,
      hasNext: false,
      hasPrev: page > 1,
      totalPages: 0,
      total: 0,
    };
  }

  static buildFilter (query, allowedFields = []) {
    const filter = {};

    // Handle search query
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      const searchFields = query.searchFields ?
        query.searchFields.split(',') :
        allowedFields.filter(field =>
          ['name', 'title', 'email', 'description'].includes(field),
        );

      if (searchFields.length > 0) {
        filter.$or = searchFields.map(field => ({
          [field]: searchRegex,
        }));
      }
    }

    // Handle specific field filters
    allowedFields.forEach(field => {
      if (query[field] !== undefined && query[field] !== '') {
        if (Array.isArray(query[field])) {
          filter[field] = { $in: query[field] };
        } else if (query[field].includes(',')) {
          filter[field] = { $in: query[field].split(',') };
        } else {
          filter[field] = query[field];
        }
      }
    });

    // Handle date range filters
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.createdAt.$lte = new Date(query.endDate);
      }
    }

    // Handle status filters
    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    return filter;
  }

  static buildSort (query, defaultSort = { createdAt: -1 }) {
    const sort = { ...defaultSort };

    if (query.sortBy && query.sortOrder) {
      const order = query.sortOrder === 'asc' ? 1 : -1;
      sort[query.sortBy] = order;
    }

    return sort;
  }

  static async paginateResults (model, filter = {}, sort = {}, pagination) {
    try {
      const [data, total] = await Promise.all([
        model.find(filter)
          .sort(sort)
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        model.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        data,
        pagination: {
          ...pagination,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static buildResponse (data, pagination, message = 'Data retrieved successfully') {
    return {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
        hasNext: pagination.hasNext,
        hasPrev: pagination.hasPrev,
      },
    };
  }

  static sanitizeQuery (query) {
    const sanitized = {};

    Object.keys(query).forEach(key => {
      if (typeof query[key] === 'string') {
        sanitized[key] = query[key].trim();
      } else {
        sanitized[key] = query[key];
      }
    });

    return sanitized;
  }
}

module.exports = QueryService;
