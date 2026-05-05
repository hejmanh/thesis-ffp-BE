export type ApiResponse<T> = {
    success: true;
    data: T;
};

export type ApiMessageResponse = ApiResponse<{ message: string }>;

export type ApiEmptyResponse = {
    success: true;
};
