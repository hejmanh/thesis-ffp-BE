-- TAM survey questions (1 = Strongly disagree … 5 = Strongly agree)
-- Open-ended feedback is collected via survey_response.feedback, not here.

INSERT INTO survey_question (code, category, question_text) VALUES
  ('PU1',   'PU',   'Using this application helps me better understand my financial freedom or retirement planning goals.'),
  ('PU2',   'PU',   'The scenario analysis features improve my ability to evaluate financial decisions.'),
  ('PU3',   'PU',   'The application enables me to make planning decisions more efficiently.'),
  ('PU4',   'PU',   'Overall, I find this application useful for long-term financial planning.'),

  ('PEOU1', 'PEOU', 'Learning to use this application was easy for me.'),
  ('PEOU2', 'PEOU', 'Navigating between features and scenarios is straightforward.'),
  ('PEOU3', 'PEOU', 'I can complete planning tasks without unnecessary effort.'),
  ('PEOU4', 'PEOU', 'The interface is clear and understandable.'),

  ('BI1',   'BI',   'I would use this application again for future financial planning.'),
  ('BI2',   'BI',   'I would recommend this application to others interested in retirement or financial independence.'),
  ('BI3',   'BI',   'If available, I would consider using this application as part of my regular planning process.'),

  ('SAT1',  'SAT',  'The comparison of different financial scenarios helped me explore possible outcomes.'),
  ('SAT2',  'SAT',  'The results presented by the application were easy to interpret.'),
  ('SAT3',  'SAT',  'I trust the calculations and projections enough to use them as decision-support information.')
ON CONFLICT (code) DO NOTHING;
