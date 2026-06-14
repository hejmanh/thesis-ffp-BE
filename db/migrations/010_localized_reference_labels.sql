ALTER TABLE country
ADD COLUMN IF NOT EXISTS name_vi TEXT;

ALTER TABLE sex_type
ADD COLUMN IF NOT EXISTS title_vi TEXT;

ALTER TABLE asset_type
ADD COLUMN IF NOT EXISTS title_vi TEXT;

ALTER TABLE scenario_type
ADD COLUMN IF NOT EXISTS title_vi TEXT,
ADD COLUMN IF NOT EXISTS description_vi TEXT;

ALTER TABLE life_stage_range
ADD COLUMN IF NOT EXISTS title_vi TEXT;

ALTER TABLE smoking_type
ADD COLUMN IF NOT EXISTS title_vi TEXT;

ALTER TABLE physical_activity_type
ADD COLUMN IF NOT EXISTS title_vi TEXT;

ALTER TABLE diet_quality_type
ADD COLUMN IF NOT EXISTS title_vi TEXT;

ALTER TABLE alcohol_consumption_type
ADD COLUMN IF NOT EXISTS title_vi TEXT;

UPDATE country SET name_vi = 'Việt Nam' WHERE code = 'VN';

UPDATE sex_type SET title_vi = 'Nam' WHERE code = 'male';
UPDATE sex_type SET title_vi = 'Nữ' WHERE code = 'female';
UPDATE sex_type SET title_vi = 'Không muốn trả lời' WHERE code = 'none';

UPDATE smoking_type SET title_vi = 'Không hút thuốc' WHERE code = 'non_smoker';
UPDATE smoking_type SET title_vi = 'Đã từng hút thuốc' WHERE code = 'former_smoker';
UPDATE smoking_type SET title_vi = 'Hút thuốc nhẹ' WHERE code = 'light_smoker';
UPDATE smoking_type SET title_vi = 'Hút thuốc nhiều' WHERE code = 'heavy_smoker';

UPDATE physical_activity_type SET title_vi = 'Năng động (>= 3 METs/ngày)' WHERE code = 'active';
UPDATE physical_activity_type SET title_vi = 'Vừa phải' WHERE code = 'moderate';
UPDATE physical_activity_type SET title_vi = 'Ít vận động' WHERE code = 'sedentary';

UPDATE diet_quality_type SET title_vi = 'Chế độ ăn lành mạnh' WHERE code = 'healthy';
UPDATE diet_quality_type SET title_vi = 'Chế độ ăn trung bình' WHERE code = 'average';
UPDATE diet_quality_type SET title_vi = 'Chế độ ăn kém' WHERE code = 'poor';

UPDATE alcohol_consumption_type SET title_vi = 'Vừa phải' WHERE code = 'moderate';
UPDATE alcohol_consumption_type SET title_vi = 'Không uống' WHERE code = 'none';
UPDATE alcohol_consumption_type SET title_vi = 'Uống nhiều rượu bia' WHERE code = 'heavy';

UPDATE life_stage_range SET title_vi = 'Giai đoạn sơ sinh' WHERE stage_no = 1;
UPDATE life_stage_range SET title_vi = 'Thời thơ ấu' WHERE stage_no = 2;
UPDATE life_stage_range SET title_vi = 'Tuổi vị thành niên' WHERE stage_no = 3;
UPDATE life_stage_range SET title_vi = 'Đầu tuổi trưởng thành' WHERE stage_no = 4;
UPDATE life_stage_range SET title_vi = 'Trung niên' WHERE stage_no = 5;
UPDATE life_stage_range SET title_vi = 'Cuối tuổi trưởng thành' WHERE stage_no = 6;

UPDATE asset_type SET title_vi = 'Thu nhập lương hưu' WHERE code = 'pension';
UPDATE asset_type SET title_vi = 'Thu nhập cho thuê' WHERE code = 'rental';
UPDATE asset_type SET title_vi = 'Thu nhập thụ động khác' WHERE code = 'other';

UPDATE scenario_type
SET
  title_vi = 'Tính khả thi của mục tiêu FFP',
  description_vi = 'Tôi có thể đạt mục tiêu Tự Do Tài Chính (FFP) không?'
WHERE no = 1;

UPDATE scenario_type
SET
  title_vi = 'Ước tính tuổi đạt FFP',
  description_vi = 'Khi nào tôi đạt Tự Do Tài Chính (FFP)?'
WHERE no = 2;

UPDATE scenario_type
SET
  title_vi = 'Chi tiêu tại FFP',
  description_vi = 'Tôi có thể chi bao nhiêu khi đạt Tự Do Tài Chính (FFP)?'
WHERE no = 3;

UPDATE scenario_type
SET
  title_vi = 'Tiết kiệm cần thiết',
  description_vi = 'Tôi nên tiết kiệm bao nhiêu để đạt Tự Do Tài Chính (FFP)?'
WHERE no = 4;
