-- Add Vietnamese translations for TAM survey questions
ALTER TABLE survey_question
  ADD COLUMN IF NOT EXISTS question_text_vi TEXT;

UPDATE survey_question SET question_text_vi = 'Sử dụng ứng dụng giúp tôi hiểu rõ hơn về mục tiêu tự do tài chính hoặc kế hoạch nghỉ hưu.'     WHERE code = 'PU1';
UPDATE survey_question SET question_text_vi = 'Tính năng phân tích tình huống giúp tôi đánh giá quyết định tài chính một cách hiệu quả hơn.'     WHERE code = 'PU2';
UPDATE survey_question SET question_text_vi = 'Ứng dụng giúp tôi đưa ra quyết định lập kế hoạch tài chính một cách hiệu quả hơn.'                WHERE code = 'PU3';
UPDATE survey_question SET question_text_vi = 'Nhìn chung, tôi tìm thấy ứng dụng này hữu ích cho việc lập kế hoạch tài chính dài hạn.'            WHERE code = 'PU4';

UPDATE survey_question SET question_text_vi = 'Học cách sử dụng ứng dụng khá dễ dàng cho tôi.'                                                    WHERE code = 'PEOU1';
UPDATE survey_question SET question_text_vi = 'Di chuyển giữa các tính năng và tình huống là rất trực quan.'                                       WHERE code = 'PEOU2';
UPDATE survey_question SET question_text_vi = 'Tôi có thể hoàn thành các nhiệm vụ lập kế hoạch tài chính một cách dễ dàng mà không cần nỗ lực quá nhiều.' WHERE code = 'PEOU3';
UPDATE survey_question SET question_text_vi = 'Giao diện của ứng dụng rõ ràng và dễ hiểu.'                                                         WHERE code = 'PEOU4';

UPDATE survey_question SET question_text_vi = 'Tôi sẽ sử dụng ứng dụng này lại cho mục đích lập kế hoạch tài chính trong tương lai.'              WHERE code = 'BI1';
UPDATE survey_question SET question_text_vi = 'Tôi sẽ giới thiệu ứng dụng này cho người khác quan tâm đến tự do tài chính hoặc nghỉ hưu.'          WHERE code = 'BI2';
UPDATE survey_question SET question_text_vi = 'Nếu có sẵn, tôi sẽ xem xét sử dụng ứng dụng này làm một phần của quy trình lập kế hoạch tài chính thường xuyên của mình.' WHERE code = 'BI3';

UPDATE survey_question SET question_text_vi = 'So sánh các tình huống tài chính khác nhau giúp tôi khám phá các kết quả có thể xảy ra.'             WHERE code = 'SAT1';
UPDATE survey_question SET question_text_vi = 'Kết quả được trình bày bởi ứng dụng dễ hiểu và dễ hiểu.'                                            WHERE code = 'SAT2';
UPDATE survey_question SET question_text_vi = 'Tôi tin tưởng vào các tính toán và dự đoán đủ để sử dụng chúng làm thông tin hỗ trợ quyết định.'    WHERE code = 'SAT3';
