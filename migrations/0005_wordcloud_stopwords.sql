-- Create wordcloud_stopwords table for managing word cloud exclusion words
CREATE TABLE IF NOT EXISTS wordcloud_stopwords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language TEXT NOT NULL CHECK (language IN ('korean', 'english')),
  words TEXT NOT NULL DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on language to ensure only one record per language
CREATE UNIQUE INDEX IF NOT EXISTS idx_wordcloud_stopwords_language ON wordcloud_stopwords(language);

-- Insert default Korean stopwords
INSERT OR REPLACE INTO wordcloud_stopwords (language, words, created_at, updated_at) VALUES (
  'korean', 
  '것,때,곳,데,바,수,중,간,쪽,뒤,앞,위,아래,옆,내,외,밖,안,등,등등,기타,일부,전체,부분,상황,경우,때문,결과,과정,방법,방식,형태,모습,상태,종류,유형,특성,성격,내용,구조,체계,시스템,이용,사용,활용,적용,구현,개발,제공,지원,관련,연관,해당,관계,대상,목적,목표,계획,예정,준비,진행,완료,시작,종료,마지막,최종,다음,이전,현재,미래,과거,에서,에게,에서는,부터,까지,에서도,으로,으로서,에게서,으로부터,에서부터,는데,의해,으로써,통해,위해,대해,관해,따라,에는,에도,만큼,보다,처럼,같이,그리고,그런데,하지만,그러나,또한,그래서,따라서,즉,이렇게,그렇게,이런,그런,저런,이것,그것,저것,여기,거기,저기,지금,나중,앞서,나중에,기술,표준,이나,이며,있다,없다,하다,되다,시키다,받다,주다,가다,오다,보다,듣다,말하다',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Insert default English stopwords
INSERT OR REPLACE INTO wordcloud_stopwords (language, words, created_at, updated_at) VALUES (
  'english',
  'the,and,for,are,but,not,you,all,can,had,her,was,one,our,out,day,get,has,him,his,how,man,new,now,old,see,two,way,who,boy,did,its,let,put,say,she,too,use,this,that,with,have,they,been,from,will,would,there,their,what,were,said,each,which,your,time,may,into,than,only,other,after,first,well,also,through,being,where,work,much,such,over,during,before,must,years,used,using,provide,based,should,could,development,system,standard,standards,technology,technologies,implementation,specification,specifications,application,applications,requirements,framework,frameworks',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);