/* OPINZO interface languages: English, Hindi and Marathi.
   UI-only localization. User-generated market questions, evidence and
   settlement criteria remain in their authored language for accuracy.
   No external translation service and no secret/API calls. */
(() => {
  'use strict';

  const KEY = 'opinzo-ui-language';
  const SUPPORTED = ['en', 'hi', 'mr'];
  const LANG_TAG = {en:'en-IN',hi:'hi-IN',mr:'mr-IN'};
  const TITLES = {
    en:'Opinzo — Think it. Predict it. Prove it.',
    hi:'Opinzo — सोचो। अनुमान लगाओ। साबित करो।',
    mr:'Opinzo — विचार करा. अंदाज वर्तवा. सिद्ध करा.'
  };
  const dictionaryRows = [
    // Official sample questions supplied by OPINZO itself.
    // Third-party/user-authored questions are never machine-translated.
    ['Will Bitcoin close above $100,000 at the end of this month?','क्या इस महीने के अंत में बिटकॉइन $100,000 से ऊपर बंद होगा?','या महिन्याच्या शेवटी बिटकॉइन $100,000 च्या वर बंद होईल का?'],
    ['Will Ethereum close above $4,000 at the end of this month?','क्या इस महीने के अंत में इथेरियम $4,000 से ऊपर बंद होगा?','या महिन्याच्या शेवटी इथेरियम $4,000 च्या वर बंद होईल का?'],
    ["Will India win its next completed men's ODI match?",'क्या भारत अपना अगला पूरा खेला गया पुरुष वनडे मैच जीतेगा?','भारत पुढचा पूर्ण झालेला पुरुषांचा एकदिवसीय सामना जिंकेल का?'],
    ['Will Apple announce a new Mac model before the end of this month?','क्या ऐपल इस महीने के अंत से पहले नया Mac मॉडल घोषित करेगा?','अॅपल या महिनाअखेरीस नवीन Mac मॉडेल जाहीर करेल का?'],
    ['Will the NIFTY 50 finish above 28,000 at month end?','क्या महीने के अंत में NIFTY 50, 28,000 से ऊपर बंद होगा?','महिनाअखेरीस NIFTY 50, 28,000 च्या वर बंद होईल का?'],
    ['Will the US Federal Reserve cut rates at its next FOMC decision?','क्या अमेरिकी फेडरल रिज़र्व अगली FOMC बैठक में दरें घटाएगा?','अमेरिकन फेडरल रिझर्व्ह पुढील FOMC निर्णयात व्याजदर कमी करेल का?'],
    ['Will Solana close above $200 at the end of this month?','क्या इस महीने के अंत में सोलाना $200 से ऊपर बंद होगा?','या महिन्याच्या शेवटी सोलाना $200 च्या वर बंद होईल का?'],
    ['Will gold close above $4,500 per troy ounce at month end?','क्या महीने के अंत में सोना $4,500 प्रति ट्रॉय औंस से ऊपर बंद होगा?','महिनाअखेरीस सोने प्रति ट्रॉय औंस $4,500 च्या वर बंद होईल का?'],
    ['Illustrative market. Resolve using the BTC/USD UTC daily close from a clearly declared exchange.','यह उदाहरण है। नतीजा पहले बताए गए एक्सचेंज के BTC/USD UTC दैनिक बंद भाव से तय होगा।','हा नमुना बाजार आहे. निकाल आधी जाहीर केलेल्या एक्सचेंजच्या BTC/USD UTC दैनिक बंद भावावर ठरेल.'],
    ['Illustrative market. Use the ETH/USD UTC close on the final calendar day.','यह उदाहरण है। अंतिम कैलेंडर दिन के ETH/USD UTC बंद भाव का उपयोग होगा।','हा नमुना बाजार आहे. शेवटच्या दिवसाच्या ETH/USD UTC बंद भावाचा वापर होईल.'],
    ['Illustrative market. No-result or abandoned fixtures must be refunded manually in a real market.','यह उदाहरण है। वास्तविक मार्केट में बिना नतीजे वाले या रद्द मैच पर मैनुअल रिफंड देना होगा।','हा नमुना बाजार आहे. खऱ्या बाजारात निकाल नसलेल्या किंवा रद्द सामन्यांसाठी गुण परत करावे लागतील.'],
    ['Illustrative market. Announcement must appear on Apple Newsroom before 23:59 UTC on the final day.','यह उदाहरण है। घोषणा आखिरी दिन 23:59 UTC से पहले Apple Newsroom पर प्रकाशित होनी चाहिए।','हा नमुना बाजार आहे. शेवटच्या दिवशी 23:59 UTC पूर्वी घोषणा Apple Newsroom वर प्रसिद्ध व्हावी.'],
    ['Illustrative market. Final official closing level at the last trading session of the month.','यह उदाहरण है। महीने के आखिरी ट्रेडिंग सत्र का आधिकारिक बंद स्तर लागू होगा।','हा नमुना बाजार आहे. महिन्याच्या शेवटच्या ट्रेडिंग सत्रातील अधिकृत बंद पातळी लागू होईल.'],
    ["Illustrative market. Use the Federal Reserve's official rate announcement.",'यह उदाहरण है। फेडरल रिज़र्व की आधिकारिक दर घोषणा लागू होगी।','हा नमुना बाजार आहे. फेडरल रिझर्व्हची अधिकृत व्याजदर घोषणा लागू होईल.'],
    ["Illustrative market. Use a declared exchange's SOL/USD UTC day-close.",'यह उदाहरण है। घोषित एक्सचेंज के SOL/USD UTC दैनिक बंद भाव का उपयोग होगा।','हा नमुना बाजार आहे. जाहीर केलेल्या एक्सचेंजच्या SOL/USD UTC दैनिक बंद भावाचा वापर होईल.'],
    ['Illustrative market. Settlement benchmark must be declared before accepting predictions.','यह उदाहरण है। अनुमान स्वीकार करने से पहले नतीजे का बेंचमार्क घोषित करना होगा।','हा नमुना बाजार आहे. अंदाज स्वीकारण्याआधी निकालाचा मापदंड जाहीर करणे आवश्यक आहे.'],
    ['Welcome bonus','स्वागत बोनस','स्वागत बोनस'],
    ['Prediction outcome settled.','अनुमान का नतीजा दर्ज हो गया।','अंदाजाचा निकाल जाहीर झाला.'],
    ['Market created successfully.','मार्केट बन गया।','बाजार तयार झाला.'],
    ['Signed in successfully.','लॉग इन सफल रहा।','लॉग इन यशस्वी.'],
    ['Signed out.','लॉग आउट हो गया।','लॉग आउट झाले.'],
    ['Password updated successfully.','पासवर्ड सफलतापूर्वक बदला।','पासवर्ड यशस्वीपणे बदलला.'],
    ['Check your email to confirm your account.','खाता पुष्टि करने के लिए ईमेल देखें।','खाते निश्चित करण्यासाठी ईमेल तपासा.'],
    ['Cricket predictions closed.','क्रिकेट अनुमान बंद हो गए।','क्रिकेट अंदाज बंद झाले.'],
    ['Cricket prediction published.','क्रिकेट अनुमान प्रकाशित हो गया।','क्रिकेट अंदाज प्रकाशित झाला.'],
    ['No current scores returned.','अभी कोई स्कोर नहीं मिला।','सध्याचे स्कोअर उपलब्ध नाहीत.'],
    ['Score request timed out. Please retry.','स्कोर लाने में देर हुई। फिर कोशिश करें।','स्कोअर मिळण्यास विलंब झाला. पुन्हा प्रयत्न करा.'],
    ['Scores temporarily unavailable.','स्कोर अभी उपलब्ध नहीं हैं।','स्कोअर सध्या उपलब्ध नाहीत.'],
    ['This prediction is closed.','यह अनुमान बंद है।','हा अंदाज बंद झाला आहे.'],
    ['You already made a prediction here.','आप यहाँ पहले ही अनुमान लगा चुके हैं।','तुम्ही येथे आधीच अंदाज नोंदवला आहे.'],
    ['Sign in before placing a prediction.','अनुमान लगाने से पहले लॉग इन करें।','अंदाज नोंदवण्यापूर्वी लॉग इन करा.'],
    ['Your account profile is not ready. Please refresh.','आपका खाता तैयार नहीं है। पेज रीफ़्रेश करें।','तुमचे खाते तयार नाही. पान रिफ्रेश करा.'],
    ['Prediction is no longer available.','यह अनुमान अब उपलब्ध नहीं है।','हा अंदाज आता उपलब्ध नाही.'],
    ['Use at least 8 characters.','कम से कम 8 अक्षर डालें।','किमान 8 अक्षरे द्या.'],
    ['Passwords do not match.','दोनों पासवर्ड मेल नहीं खाते।','दोन्ही पासवर्ड जुळत नाहीत.'],
    ['Reset link expired. Request a new reset email.','रीसेट लिंक की समय-सीमा खत्म हो गई। नई ईमेल माँगें।','रीसेट लिंकची मुदत संपली. नवीन ईमेल मागवा.'],
    ['Demo reset.','डेमो रीसेट हो गया।','डेमो रीसेट झाला.'],
    ['EXPLORE','देखें','शोधा'],
    ['Discover','खोजें','शोधा'],
    ['Trending','ट्रेंडिंग','लोकप्रिय'],
    ['My Predictions','मेरे अनुमान','माझे अंदाज'],
    ['My predictions','मेरे अनुमान','माझे अंदाज'],
    ['My Wallet','मेरा वॉलेट','माझे वॉलेट'],
    ['Leaderboard','लीडरबोर्ड','गुणतालिका'],
    ['CATEGORIES','श्रेणियाँ','विभाग'],
    ['Crypto','क्रिप्टो','क्रिप्टो'],
    ['Sports','खेल','क्रीडा'],
    ['Cricket','क्रिकेट','क्रिकेट'],
    ['Technology','टेक्नोलॉजी','तंत्रज्ञान'],
    ['Markets','मार्केट','बाजार'],
    ['World','दुनिया','जग'],
    ['All','सभी','सर्व'],
    ['Every opinion counts.','हर राय मायने रखती है।','प्रत्येक मत महत्त्वाचे आहे.'],
    ['Challenge your predictions. Learn from the results.','अपने अनुमानों को परखें और नतीजों से सीखें।','आपले अंदाज तपासा आणि निकालातून शिका.'],
    ['How it works','यह कैसे काम करता है','हे कसे काम करते'],
    ['Virtual points only · No cash value','सिर्फ वर्चुअल पॉइंट्स · नकद मूल्य नहीं','फक्त आभासी गुण · रोख मूल्य नाही'],
    ['Search predictions, topics...','अनुमान और विषय खोजें...','अंदाज आणि विषय शोधा...'],
    ['● DEMO','● डेमो','● डेमो'],
    ['● LIVE BETA','● लाइव बीटा','● लाइव्ह बीटा'],
    ['Demo player','डेमो खिलाड़ी','डेमो खेळाडू'],
    ['Demo player (you)','डेमो खिलाड़ी (आप)','डेमो खेळाडू (तुम्ही)'],
    ['Sign in','लॉग इन','लॉग इन'],
    ['Account','खाता','खाते'],
    ['Loading Opinzo...','Opinzo लोड हो रहा है...','Opinzo लोड होत आहे...'],
    ['Loading...','लोड हो रहा है...','लोड होत आहे...'],
    ['Explore','देखें','शोधा'],
    ['My picks','मेरी पसंद','माझे अंदाज'],
    ['Wallet','वॉलेट','वॉलेट'],
    ['Think it.','सोचो।','विचार करा.'],
    ['Predict it.','अनुमान लगाओ।','अंदाज वर्तवा.'],
    ['Prove it.','साबित करो।','सिद्ध करा.'],
    ['Think it. Predict it. Prove it.','सोचो। अनुमान लगाओ। साबित करो।','विचार करा. अंदाज वर्तवा. सिद्ध करा.'],
    ['THE FUTURE IS AN OPINION','भविष्य के बारे में आपकी राय','भविष्यासाठी तुमचा अंदाज'],
    ['Turn your knowledge into a track record. Pick a side, earn virtual points, and rise on the leaderboard.','अपने ज्ञान को परखें। अपना पक्ष चुनें, वर्चुअल पॉइंट्स कमाएँ और लीडरबोर्ड पर आगे बढ़ें।','तुमच्या ज्ञानाची कसोटी पाहा. पर्याय निवडा, आभासी गुण मिळवा आणि गुणतालिकेत पुढे जा.'],
    ['Explore markets','मार्केट देखें','बाजार पाहा'],
    ['Your decisions matter','आपके फैसले मायने रखते हैं','तुमचे निर्णय महत्त्वाचे आहेत'],
    ['Think ahead','आगे की सोचें','पुढचा विचार करा'],
    ['Ready to put your perspective to the test?','अपनी राय को परखने के लिए तैयार हैं?','तुमचा अंदाज तपासण्यासाठी तयार आहात का?'],
    ['Your balance','आपका बैलेंस','तुमची शिल्लक'],
    ['Free virtual points','मुफ़्त वर्चुअल पॉइंट्स','मोफत आभासी गुण'],
    ['Active predictions','सक्रिय अनुमान','सक्रिय अंदाज'],
    ['Waiting for results','नतीजों का इंतज़ार','निकालाची प्रतीक्षा'],
    ['Prediction accuracy','अनुमान की सटीकता','अंदाजाची अचूकता'],
    ['Trending predictions','लोकप्रिय अनुमान','लोकप्रिय अंदाज'],
    ['Explore predictions','अनुमान देखें','अंदाज पाहा'],
    ['Pick a side. Build your accuracy. Community pick % is not a probability forecast.','अपना विकल्प चुनें। सटीकता बढ़ाएँ। समुदाय का प्रतिशत जीत की संभावना नहीं है।','पर्याय निवडा. अचूकता वाढवा. समुदायाची टक्केवारी म्हणजे निकालाची शक्यता नाही.'],
    ['Most popular','सबसे लोकप्रिय','सर्वाधिक लोकप्रिय'],
    ['Newest','सबसे नए','सर्वात नवीन'],
    ['Closing soon','जल्द बंद होंगे','लवकरच बंद होणारे'],
    ['No predictions found','कोई अनुमान नहीं मिला','कोणताही अंदाज सापडला नाही'],
    ['Try another category or search phrase.','दूसरी श्रेणी या शब्द खोजें।','दुसरा विभाग किंवा शब्द शोधा.'],
    ['Clear filters','फ़िल्टर हटाएँ','फिल्टर काढा'],
    ['● OPEN','● चालू','● सुरू'],
    ['● CLOSED','● बंद','● बंद'],
    ['● RESOLVED','● परिणाम घोषित','● निकाल जाहीर'],
    ['● VOID','● रद्द','● रद्द'],
    ['OPEN','चालू','सुरू'],
    ['CLOSED','बंद','बंद'],
    ['RESOLVED','नतीजा घोषित','निकाल जाहीर'],
    ['VOID','रद्द','रद्द'],
    ['YES','हाँ','होय'],
    ['NO','नहीं','नाही'],
    ['Refunded','पॉइंट्स वापस','गुण परत'],
    ['View result / details','नतीजा / विवरण देखें','निकाल / तपशील पाहा'],
    ['Closes today','आज बंद होगा','आज बंद होईल'],
    ['Closed','बंद','बंद'],
    ['THE COMMUNITY','समुदाय','समुदाय'],
    ["What's trending",'क्या लोकप्रिय है','काय लोकप्रिय आहे'],
    ['The most-picked prediction questions in our community.','समुदाय में सबसे ज़्यादा चुने गए अनुमान।','समुदायातील सर्वाधिक निवडलेले अंदाज.'],
    ['YOUR TRACK RECORD','आपका रिकॉर्ड','तुमचा रेकॉर्ड'],
    ['All your opinions, outcomes and virtual point gains in one place.','आपके सभी अनुमान, नतीजे और वर्चुअल पॉइंट्स एक जगह।','तुमचे अंदाज, निकाल आणि आभासी गुण एकाच ठिकाणी.'],
    ['Total picks','कुल अनुमान','एकूण अंदाज'],
    ['Since joining','शुरुआत से','सुरुवातीपासून'],
    ['Correct picks','सही अनुमान','बरोबर अंदाज'],
    ['Resolved wins','घोषित सही अनुमान','जाहीर झालेले बरोबर अंदाज'],
    ['Accuracy','सटीकता','अचूकता'],
    ['Prediction history','अनुमानों का इतिहास','अंदाजांचा इतिहास'],
    ['No predictions yet','अभी कोई अनुमान नहीं','अजून अंदाज नाहीत'],
    ['Explore questions and make your first pick.','प्रश्न देखें और पहला अनुमान लगाएँ।','प्रश्न पाहा आणि पहिला अंदाज नोंदवा.'],
    ['Sign in to get started','शुरू करने के लिए लॉग इन करें','सुरू करण्यासाठी लॉग इन करा'],
    ['Create your free account to track predictions and virtual points.','अनुमान और पॉइंट्स देखने के लिए मुफ़्त खाता बनाएँ।','अंदाज आणि गुण पाहण्यासाठी मोफत खाते तयार करा.'],
    ['Sign in / Create account','लॉग इन / खाता बनाएँ','लॉग इन / खाते तयार करा'],
    ['✓ WON','✓ जीते','✓ जिंकले'],
    ['✕ LOST','✕ हारे','✕ हरले'],
    ['↩ REFUNDED','↩ वापस मिले','↩ परत मिळाले'],
    ['◷ PENDING','◷ लंबित','◷ प्रलंबित'],
    ['No payout','कोई पॉइंट नहीं मिला','गुण मिळाले नाहीत'],
    ['Stake returned','लगाए गए पॉइंट्स वापस','लावलेले गुण परत'],
    ['Awaiting result','नतीजे का इंतज़ार','निकालाची प्रतीक्षा'],
    ['YOUR VIRTUAL WALLET','आपका वर्चुअल वॉलेट','तुमचे आभासी वॉलेट'],
    ['Coin wallet','कॉइन वॉलेट','कॉइन वॉलेट'],
    ['A transparent record of your free virtual points. No withdrawals, purchases or redemptions.','आपके मुफ़्त वर्चुअल पॉइंट्स का रिकॉर्ड। नकद निकालना, खरीदना या रिडीम करना संभव नहीं।','तुमच्या मोफत आभासी गुणांची नोंद. पैसे काढणे, खरेदी किंवा रिडीम करणे शक्य नाही.'],
    ['Available virtual balance','उपलब्ध वर्चुअल बैलेंस','उपलब्ध आभासी शिल्लक'],
    ['Opinzo Points • No monetary value','Opinzo पॉइंट्स • कोई नकद मूल्य नहीं','Opinzo गुण • रोख मूल्य नाही'],
    ['Transaction history','लेन-देन का इतिहास','व्यवहारांचा इतिहास'],
    ['No transactions yet.','अभी कोई लेन-देन नहीं।','अजून व्यवहार नाहीत.'],
    ['How virtual coins work','वर्चुअल कॉइन्स कैसे काम करते हैं','आभासी कॉइन्स कसे काम करतात'],
    ['New users start with 500 free points. A pick deducts your stake. Correct pick: 2× the stake is returned (net +1×). Incorrect pick: you lose the virtual stake (net −1×). Points cannot be bought, sold, transferred or converted to gifts or cash.','नए यूज़र को 500 मुफ़्त पॉइंट्स मिलते हैं। अनुमान लगाने पर पॉइंट्स कटते हैं। सही अनुमान पर लगाई गई राशि का 2× वापस मिलता है (शुद्ध लाभ 1×)। गलत होने पर लगाए गए वर्चुअल पॉइंट्स चले जाते हैं। इन्हें खरीदा, बेचा, ट्रांसफ़र या उपहार/नकद में बदला नहीं जा सकता।','नवीन वापरकर्त्यांना 500 मोफत गुण मिळतात. अंदाज निवडल्यावर गुण वजा होतात. बरोबर अंदाजावर लावलेल्या गुणांच्या 2× गुण परत मिळतात (निव्वळ नफा 1×). चुकल्यास लावलेले आभासी गुण जातात. गुण खरेदी, विक्री, हस्तांतरण किंवा भेटवस्तू/रोख रकमेत बदलता येत नाहीत.'],
    ['Top predictors','टॉप अनुमानकर्ता','अव्वल अंदाजकर्ते'],
    ['Knowledge meets consistency. Rankings are based on number of correct resolved picks.','रैंकिंग घोषित किए गए सही अनुमानों की संख्या पर आधारित है।','क्रमवारी निकाल जाहीर झालेल्या बरोबर अंदाजांच्या संख्येवर आधारित आहे.'],
    ['RANK','रैंक','क्रमांक'],
    ['PLAYER','खिलाड़ी','खेळाडू'],
    ['WINS','जीत','विजय'],
    ['PICKS','अनुमान','अंदाज'],
    ['POINTS','पॉइंट्स','गुण'],
    ['No rankings yet.','अभी कोई रैंकिंग नहीं।','अजून क्रमवारी नाही.'],
    ['No players yet.','अभी कोई खिलाड़ी नहीं।','अजून खेळाडू नाहीत.'],
    ['Your overview','आपका सारांश','तुमचा आढावा'],
    ['Opinzo Points','Opinzo पॉइंट्स','Opinzo गुण'],
    ['Virtual balance · No cash value','वर्चुअल बैलेंस · नकद मूल्य नहीं','आभासी शिल्लक · रोख मूल्य नाही'],
    ['View wallet','वॉलेट देखें','वॉलेट पाहा'],
    ['Full leaderboard','पूरा लीडरबोर्ड','पूर्ण गुणतालिका'],
    ['Play smart, not risky','समझदारी से खेलें, जोखिम से नहीं','विचारपूर्वक खेळा, जोखीम टाळा'],
    ['Read the exact settlement criteria before you vote. Community pick percentages reflect participation, not guaranteed outcomes.','अनुमान लगाने से पहले नतीजा तय करने के नियम पढ़ें। समुदाय की पसंद के प्रतिशत जीत की गारंटी नहीं हैं।','अंदाज नोंदवण्यापूर्वी निकालाचे नेमके नियम वाचा. समुदायाच्या निवडीची टक्केवारी निकालाची हमी नाही.'],
    ['Demo tools','डेमो टूल्स','डेमो साधने'],
    ['Admin dashboard','एडमिन डैशबोर्ड','प्रशासक डॅशबोर्ड'],
    ['Backend notice','बैकएंड सूचना','बॅकएंड सूचना'],
    ['Preview mode is active.','प्रीव्यू मोड चालू है।','प्रीव्ह्यू मोड सुरू आहे.'],
    ['Predictions, points and the sample leaderboard are stored or simulated in this browser only. No real users, live prices, or real rewards. Connect Supabase to launch online accounts.','अनुमान, पॉइंट्स और नमूना लीडरबोर्ड सिर्फ इस ब्राउज़र में हैं। असली यूज़र, लाइव कीमतें या वास्तविक इनाम नहीं हैं। ऑनलाइन खाते चालू करने के लिए Supabase जोड़ें।','अंदाज, गुण आणि नमुना गुणतालिका फक्त या ब्राउझरमध्ये आहेत. खरे वापरकर्ते, लाइव्ह किंमती किंवा प्रत्यक्ष बक्षिसे नाहीत. ऑनलाइन खात्यांसाठी Supabase जोडा.'],
    ['THE BASICS','बुनियादी जानकारी','मूलभूत माहिती'],
    ['How Opinzo works','Opinzo कैसे काम करता है','Opinzo कसे काम करते'],
    ['Predict with free, non-redeemable virtual points. No real money involved.','मुफ़्त, रिडीम नहीं किए जा सकने वाले वर्चुअल पॉइंट्स से अनुमान लगाएँ। असली पैसों का लेन-देन नहीं।','मोफत, रिडीम न करता येणाऱ्या आभासी गुणांनी अंदाज वर्तवा. खऱ्या पैशांचा व्यवहार नाही.'],
    ['Choose a question','प्रश्न चुनें','प्रश्न निवडा'],
    ['Read its precise deadline and official resolution criteria.','उसकी समय-सीमा और नतीजा तय करने के नियम पढ़ें।','वेळमर्यादा आणि निकालाचे अधिकृत नियम वाचा.'],
    ['Pick Yes or No','हाँ या नहीं चुनें','होय किंवा नाही निवडा'],
    ['Stake 10, 25, 50 or 100 virtual points. Your stake is deducted immediately.','10, 25, 50 या 100 वर्चुअल पॉइंट्स लगाएँ। ये तुरंत कटेंगे।','10, 25, 50 किंवा 100 आभासी गुण लावा. ते लगेच वजा होतील.'],
    ['Earn by being right','सही होने पर पॉइंट्स पाएँ','बरोबर अंदाजावर गुण मिळवा'],
    ['If correct, receive 2× your stake (net gain 1×). If wrong, your original stake is lost. No market will auto-settle without verification.','सही अनुमान पर 2× पॉइंट्स वापस (शुद्ध लाभ 1×); गलत होने पर लगाए गए पॉइंट्स कटेंगे। जाँच के बिना कोई नतीजा अपने आप घोषित नहीं होगा।','बरोबर अंदाजावर 2× गुण परत (निव्वळ लाभ 1×); चुकल्यास लावलेले गुण जातील. पडताळणीशिवाय निकाल आपोआप जाहीर होणार नाही.'],
    ['Build your track record','अपना रिकॉर्ड बनाएँ','तुमचा रेकॉर्ड तयार करा'],
    ['See your history and compete on the leaderboard.','अपना इतिहास देखें और लीडरबोर्ड पर मुकाबला करें।','इतिहास पाहा आणि गुणतालिकेत स्पर्धा करा.'],
    ['Got it','समझ गया','समजले'],
    ['BROWSER DEMO','ब्राउज़र डेमो','ब्राउझर डेमो'],
    ["You're using the demo",'आप डेमो इस्तेमाल कर रहे हैं','तुम्ही डेमो वापरत आहात'],
    ['This preview lets you test OPINZO without creating an account. Your 500 starting points, picks and outcomes stay only in this browser.','आप बिना खाता बनाए OPINZO जाँच सकते हैं। 500 शुरुआती पॉइंट्स, अनुमान और नतीजे सिर्फ इस ब्राउज़र में रहेंगे।','खाते न तयार करता OPINZO वापरून पाहू शकता. सुरुवातीचे 500 गुण, अंदाज आणि निकाल फक्त या ब्राउझरमध्ये राहतील.'],
    ['Continue demo','डेमो जारी रखें','डेमो सुरू ठेवा'],
    ['YOUR ACCOUNT','आपका खाता','तुमचे खाते'],
    ['Reset password by email','ईमेल से पासवर्ड रीसेट करें','ईमेलद्वारे पासवर्ड रीसेट करा'],
    ['Sign out','लॉग आउट','लॉग आउट'],
    ['JOIN OPINZO','OPINZO से जुड़ें','OPINZO मध्ये सहभागी व्हा'],
    ['Create your free account','मुफ़्त खाता बनाएँ','मोफत खाते तयार करा'],
    ['Welcome back','फिर से स्वागत है','पुन्हा स्वागत आहे'],
    ['Start with 500 free virtual points.','शुरू में 500 मुफ़्त वर्चुअल पॉइंट्स पाएँ।','सुरुवातीला 500 मोफत आभासी गुण मिळवा.'],
    ['Sign in to see your predictions and wallet.','अपने अनुमान और वॉलेट देखने के लिए लॉग इन करें।','अंदाज आणि वॉलेट पाहण्यासाठी लॉग इन करा.'],
    ['Public display name','सार्वजनिक नाम','सार्वजनिक नाव'],
    ['Your nickname','आपका उपनाम','तुमचे टोपणनाव'],
    ['Email address','ईमेल पता','ईमेल पत्ता'],
    ['Password','पासवर्ड','पासवर्ड'],
    ['At least 6 characters','कम से कम 6 अक्षर','किमान 6 अक्षरे'],
    ['Create free account','मुफ़्त खाता बनाएँ','मोफत खाते तयार करा'],
    ['Forgot password?','पासवर्ड भूल गए?','पासवर्ड विसरलात?'],
    ['Already have an account?','पहले से खाता है?','आधीपासून खाते आहे?'],
    ['New to Opinzo?','Opinzo पर नए हैं?','Opinzo वर नवीन आहात?'],
    ['Create account','खाता बनाएँ','खाते तयार करा'],
    ['ACCOUNT RECOVERY','खाता रिकवरी','खाते पुनर्प्राप्ती'],
    ['Enter your email to receive a secure password reset link.','पासवर्ड रीसेट लिंक पाने के लिए ईमेल डालें।','पासवर्ड रीसेट लिंकसाठी ईमेल द्या.'],
    ['Send reset link','रीसेट लिंक भेजें','रीसेट लिंक पाठवा'],
    ['Back to sign in','लॉग इन पर लौटें','लॉग इनकडे परत'],
    ['CHECK YOUR EMAIL','ईमेल जाँचें','ईमेल तपासा'],
    ['Reset link requested','रीसेट लिंक माँगा गया','रीसेट लिंक मागवली'],
    ['If this address has an account, a reset email will arrive shortly. Check spam too. Open the newest link and choose a new password. Never share the link.','इस ईमेल पर खाता होने पर रीसेट लिंक आएगी। स्पैम भी देखें। नई लिंक से नया पासवर्ड चुनें। लिंक किसी से साझा न करें।','या ईमेलवर खाते असल्यास रीसेट लिंक येईल. स्पॅमही तपासा. नवीन लिंक उघडून पासवर्ड बदला. लिंक कुणाशीही शेअर करू नका.'],
    ['Done','हो गया','झाले'],
    ['SECURE YOUR ACCOUNT','खाता सुरक्षित करें','खाते सुरक्षित करा'],
    ['Choose a new password','नया पासवर्ड चुनें','नवीन पासवर्ड निवडा'],
    ['Use at least 8 characters. This changes your Opinzo sign-in password.','कम से कम 8 अक्षर इस्तेमाल करें। इससे Opinzo लॉग इन पासवर्ड बदलेगा।','किमान 8 अक्षरे वापरा. यामुळे Opinzo लॉग इन पासवर्ड बदलेल.'],
    ['New password','नया पासवर्ड','नवीन पासवर्ड'],
    ['Confirm new password','नया पासवर्ड फिर डालें','नवीन पासवर्ड पुन्हा द्या'],
    ['Update password','पासवर्ड अपडेट करें','पासवर्ड अपडेट करा'],
    ['MAKE A PREDICTION','अनुमान लगाएँ','अंदाज नोंदवा'],
    ['Pick your side','अपना विकल्प चुनें','तुमचा पर्याय निवडा'],
    ['Choose your virtual point stake','कितने वर्चुअल पॉइंट्स लगाएँ?','किती आभासी गुण लावायचे?'],
    ['Stake deducted now','अब काटे जाने वाले पॉइंट्स','आता वजा होणारे गुण'],
    ['Payout if correct (includes stake)','सही होने पर वापसी (लगाए पॉइंट्स सहित)','बरोबर असल्यास परतावा (लावलेल्या गुणांसह)'],
    ['Outcome is resolved by the admin after the deadline. Each market allows one prediction per account.','समय-सीमा के बाद एडमिन नतीजा तय करेगा। एक खाते से हर प्रश्न पर सिर्फ एक अनुमान।','वेळ संपल्यावर प्रशासक निकाल जाहीर करेल. एका खात्यातून प्रत्येक प्रश्नाला एकच अंदाज.'],
    ['This is a browser-local simulation.','यह सिर्फ ब्राउज़र डेमो है।','हा फक्त ब्राउझर डेमो आहे.'],
    ['Insufficient points.','पर्याप्त पॉइंट्स नहीं हैं।','पुरेसे गुण नाहीत.'],
    ['MARKET DETAILS','मार्केट विवरण','बाजार तपशील'],
    ['No additional criteria provided.','अतिरिक्त नियम उपलब्ध नहीं हैं।','अतिरिक्त नियम दिलेले नाहीत.'],
    ['Closes','बंद होगा','बंद होईल'],
    ['Status','स्थिति','स्थिती'],
    ['Official outcome','आधिकारिक नतीजा','अधिकृत निकाल'],
    ['VOID / REFUND','रद्द / पॉइंट्स वापस','रद्द / गुण परत'],
    ['Source:','स्रोत:','स्रोत:'],
    ['View resolution evidence','नतीजे का सबूत देखें','निकालाचा पुरावा पाहा'],
    ['Your prediction','आपका अनुमान','तुमचा अंदाज'],
    ['Result','नतीजा','निकाल'],
    ['Close','बंद करें','बंद करा'],
    ['Verified outcome','पुष्टि किया हुआ नतीजा','पडताळलेला निकाल'],
    ['Public source URL (https://)','सार्वजनिक स्रोत लिंक (https://)','सार्वजनिक स्रोत लिंक (https://)'],
    ['VOID (refund points)','रद्द (पॉइंट्स वापस)','रद्द (गुण परत)'],
    ['Confirm verified outcome','पुष्टि किया नतीजा दर्ज करें','पडताळलेला निकाल नोंदवा'],
    ['Simulate outcome','डेमो नतीजा दिखाएँ','डेमो निकाल दाखवा'],
    ['SIMULATE RESULT','डेमो नतीजा','डेमो निकाल'],
    ['ADMIN RESOLUTION','एडमिन द्वारा नतीजा','प्रशासकाचा निकाल'],
    ['Resolve prediction','अनुमान का नतीजा तय करें','अंदाजाचा निकाल जाहीर करा'],
    ['This simulates a result locally. It does not verify an actual event.','यह सिर्फ स्थानीय डेमो है, किसी वास्तविक घटना का सत्यापन नहीं।','हा फक्त स्थानिक डेमो आहे; प्रत्यक्ष घटनेची पडताळणी नाही.'],
    ['LOCAL SANDBOX','स्थानीय डेमो','स्थानिक डेमो'],
    ['ADMIN AREA','एडमिन क्षेत्र','प्रशासक विभाग'],
    ['Market management','मार्केट प्रबंधन','बाजार व्यवस्थापन'],
    ['Simulated outcomes for browser testing only.','केवल ब्राउज़र परीक्षण के लिए डेमो परिणाम।','फक्त ब्राउझर चाचणीसाठी डेमो निकाल.'],
    ['Only approved admins can create and resolve markets through secure database functions.','केवल अनुमोदित एडमिन सुरक्षित डेटाबेस से मार्केट बना और हल कर सकते हैं।','फक्त मान्यताप्राप्त प्रशासक सुरक्षित डेटाबेसद्वारे बाजार तयार आणि निकाली काढू शकतात.'],
    ['Question (clear, verifiable outcome)','प्रश्न (स्पष्ट, सत्यापित नतीजा)','प्रश्न (स्पष्ट, पडताळता येणारा निकाल)'],
    ['Will XYZ happen by a specific date?','क्या XYZ तय तारीख तक होगा?','XYZ ठराविक तारखेपर्यंत होईल का?'],
    ['Settlement criteria','नतीजा तय करने के नियम','निकालाचे निकष'],
    ['Exact source, measurement, deadline, tie / cancellation policy...','सटीक स्रोत, माप, समय-सीमा, टाई / रद्द नियम...','नेमका स्रोत, मोजमाप, वेळमर्यादा, बरोबरी / रद्द नियम...'],
    ['Category','श्रेणी','विभाग'],
    ['Closes at (your local time)','बंद होने का समय (आपका स्थानीय समय)','बंद होण्याची वेळ (स्थानिक वेळ)'],
    ['Create market','मार्केट बनाएँ','बाजार तयार करा'],
    ['Settle markets','मार्केट के नतीजे तय करें','बाजारांचे निकाल द्या'],
    ['Demo outcomes are arbitrary simulations.','डेमो नतीजे सिर्फ परीक्षण के लिए हैं।','डेमो निकाल फक्त चाचणीसाठी आहेत.'],
    ['Real markets can only be settled after their closing time. Verify an authoritative source first.','वास्तविक मार्केट समय पूरा होने पर ही सुलझाएँ। पहले विश्वसनीय स्रोत जाँचें।','खरे बाजार वेळ संपल्यावरच निकाली काढा. आधी विश्वासार्ह स्रोत तपासा.'],
    ['No unresolved markets.','कोई लंबित मार्केट नहीं।','कोणतेही प्रलंबित बाजार नाहीत.'],
    ['Close predictions now','अभी अनुमान बंद करें','आता अंदाज बंद करा'],
    ['Resolve','नतीजा दर्ज करें','निकाल द्या'],
    ['Reset browser demo (erase local picks)','डेमो रीसेट करें (स्थानीय अनुमान हटाएँ)','डेमो रीसेट करा (स्थानिक अंदाज काढा)'],
    ['SPORTS / CRICKET','खेल / क्रिकेट','क्रीडा / क्रिकेट'],
    ['Live cricket scores','लाइव क्रिकेट स्कोर','लाइव्ह क्रिकेट स्कोअर'],
    ['Current scores from ESPNcricinfo. Auto-refresh every 2 minutes while this page is visible.','ESPNcricinfo से वर्तमान स्कोर। पेज खुला रहने पर हर 2 मिनट में अपडेट।','ESPNcricinfo वरील सध्याचे स्कोअर. पान उघडे असताना दर 2 मिनिटांनी अपडेट.'],
    ['Refresh scores','स्कोर अपडेट करें','स्कोअर अपडेट करा'],
    ['Scores can be delayed by the provider. * marks the batting side in the source feed. Scores do not automatically settle prediction questions.','स्कोर प्रदाता से देर से आ सकते हैं। * बल्लेबाज़ी करने वाली टीम है। स्कोर से नतीजे अपने आप तय नहीं होते।','प्रदात्याकडून स्कोअर उशिरा येऊ शकतात. * फलंदाजी करणारा संघ दर्शवतो. स्कोअरवरून अंदाजाचे निकाल आपोआप ठरत नाहीत.'],
    ['Cricket match centre','क्रिकेट मैच सेंटर','क्रिकेट सामना केंद्र'],
    ['Follow scores and open the full scorecard for match details.','स्कोर देखें और मैच का पूरा स्कोरकार्ड खोलें।','स्कोअर पाहा आणि सामन्याचे संपूर्ण स्कोअरकार्ड उघडा.'],
    ['Browse Sports predictions','खेल अनुमान देखें','क्रीडा अंदाज पाहा'],
    ['Fetching cricket scores…','क्रिकेट स्कोर ला रहे हैं…','क्रिकेट स्कोअर आणत आहोत…'],
    ['Scores temporarily unavailable','स्कोर फिलहाल उपलब्ध नहीं','स्कोअर सध्या उपलब्ध नाहीत'],
    ['Loading match centre…','मैच सेंटर लोड हो रहा है…','सामना केंद्र लोड होत आहे…'],
    ['Connecting to the score provider.','स्कोर प्रदाता से जुड़ रहे हैं।','स्कोअर प्रदात्याशी जोडत आहोत.'],
    ['FEED DELAYED','फीड में देरी','फीड उशिरा येत आहे'],
    ['SCORE FEED CONNECTED','स्कोर फीड कनेक्टेड','स्कोअर फीड जोडला आहे'],
    ['Provider update time unavailable','प्रदाता अपडेट समय उपलब्ध नहीं','प्रदाता अपडेट वेळ उपलब्ध नाही'],
    ['Refreshing…','अपडेट हो रहा है…','अपडेट होत आहे…'],
    ['Showing the last received scores.','आखिरी प्राप्त स्कोर दिखा रहे हैं।','शेवटचे मिळालेले स्कोअर दाखवत आहोत.'],
    ['Full scorecard','पूरा स्कोरकार्ड','पूर्ण स्कोअरकार्ड'],
    ['CRICKET · ESPNCRICINFO','क्रिकेट · ESPNCRICINFO','क्रिकेट · ESPNCRICINFO'],
    ['CRICKET PREDICTIONS · VIRTUAL POINTS','क्रिकेट अनुमान · वर्चुअल पॉइंट्स','क्रिकेट अंदाज · आभासी गुण'],
    ['Choose a question. Each line has its own deadline and settlement rules. Correct: 2× stake. Tie / cancellation follows the question\'s refund rules.','प्रश्न चुनें। हर प्रश्न की समय-सीमा और नतीजे के नियम अलग हैं। सही उत्तर: 2× पॉइंट्स। टाई या रद्द होने पर प्रश्न के रिफंड नियम लागू होंगे।','प्रश्न निवडा. प्रत्येक प्रश्नाची वेळमर्यादा आणि नियम वेगळे आहेत. योग्य अंदाज: 2× गुण. बरोबरी किंवा रद्द झाल्यास प्रश्नाचे परतावा नियम लागू होतील.'],
    ['Add prediction question','अनुमान प्रश्न जोड़ें','अंदाजाचा प्रश्न जोडा'],
    ['No prediction questions yet','अभी अनुमान प्रश्न नहीं हैं','अजून अंदाजाचे प्रश्न नाहीत'],
    ['The admin must publish an exact line and closing time first.','पहले एडमिन को सटीक सीमा और बंद होने का समय तय करना होगा।','आधी प्रशासकाने नेमकी मर्यादा आणि बंद होण्याची वेळ जाहीर करावी.'],
    ['ADMIN · CRICKET','एडमिन · क्रिकेट','प्रशासक · क्रिकेट'],
    ['Add match prediction','मैच अनुमान जोड़ें','सामन्याचा अंदाज जोडा'],
    ['Prediction type','अनुमान का प्रकार','अंदाजाचा प्रकार'],
    ['Match winner','मैच विजेता','सामन्याचा विजेता'],
    ['Session / over runs','सेशन / ओवर के रन','सत्र / षटकांतील धावा'],
    ['Innings total runs','पारी के कुल रन','डावातील एकूण धावा'],
    ['Team wickets','टीम के विकेट','संघाचे बळी'],
    ['Player runs','खिलाड़ी के रन','खेळाडूच्या धावा'],
    ['Player wickets','खिलाड़ी के विकेट','खेळाडूचे बळी'],
    ['Exact team or player','सटीक टीम या खिलाड़ी','नेमका संघ किंवा खेळाडू'],
    ['Team name, or full player name','टीम या खिलाड़ी का पूरा नाम','संघाचे किंवा खेळाडूचे पूर्ण नाव'],
    ['Over / Under line (ignored for winner)','ऊपर / नीचे सीमा (विजेता में नहीं)','अधिक / कमी मर्यादा (विजेत्यास लागू नाही)'],
    ['Innings and exact period','पारी और सटीक अवधि','डाव आणि नेमका कालावधी'],
    ['Full match','पूरा मैच','संपूर्ण सामना'],
    ['1st innings, overs 1–6; or full innings','पहली पारी, ओवर 1–6; या पूरी पारी','पहिला डाव, षटके 1–6; किंवा पूर्ण डाव'],
    ['Predictions close (local time)','अनुमान बंद होने का समय (स्थानीय)','अंदाज बंद होण्याची वेळ (स्थानिक)'],
    ['Exact settlement and refund rules','नतीजे और रिफंड के सटीक नियम','निकाल आणि परताव्याचे नेमके नियम'],
    ['Declare innings, overs, how DLS / reduced overs / retirement / abandoned matches are handled, and when to VOID.','पारी, ओवर, DLS, कम ओवर, रिटायरमेंट और रद्द मैच के नियम और VOID की स्थिति लिखें।','डाव, षटके, DLS, कमी षटके, निवृत्ती आणि रद्द सामने यांचे नियम व VOID ची अट लिहा.'],
    ['Close at least 5 minutes from now, before the deciding event. Only publish unresolved outcomes. Session/player results require admin verification against the official scorecard.','निर्णायक घटना से पहले, कम से कम 5 मिनट आगे की समय-सीमा रखें। पहले से तय नतीजा प्रकाशित न करें। खिलाड़ी/सेशन परिणाम आधिकारिक स्कोरकार्ड से जाँचें।','निर्णायक घटनेआधी किमान 5 मिनिटांची वेळ ठेवा. आधीच ठरलेले निकाल प्रकाशित करू नका. खेळाडू/सत्र निकाल अधिकृत स्कोअरकार्डवरून तपासा.'],
    ['Publish prediction','अनुमान प्रकाशित करें','अंदाज प्रकाशित करा'],
    ['Other team wins','दूसरी टीम जीतेगी','दुसरा संघ जिंकेल'],
    ['Open wallet','वॉलेट खोलें','वॉलेट उघडा'],
    ['Open menu','मेन्यू खोलें','मेन्यू उघडा'],
    ['Sort predictions','अनुमान क्रमबद्ध करें','अंदाज क्रमबद्ध करा'],
    ['Search predictions','अनुमान खोजें','अंदाज शोधा'],
    ['Opinzo home','Opinzo होम','Opinzo मुख्यपृष्ठ'],
    ['Close dialog','डायलॉग बंद करें','संवाद बंद करा'],
    ['Main navigation','मुख्य नेविगेशन','मुख्य नेव्हिगेशन'],
    ['Mobile navigation','मोबाइल नेविगेशन','मोबाइल नेव्हिगेशन'],
    ['Account summary','खाता सारांश','खाते आढावा'],
    ['Language','भाषा','भाषा'],
    ['Choose language','भाषा चुनें','भाषा निवडा'],
    ['Free-to-play • Non-transferable points • No money value','मुफ़्त खेलें • पॉइंट्स ट्रांसफ़र नहीं होते • नकद मूल्य नहीं','मोफत खेळा • गुण हस्तांतरित होत नाहीत • रोख मूल्य नाही']
  ];

  const words = Object.create(null);
  for (const [en,hi,mr] of dictionaryRows) words[en] = {hi,mr};
  const textRecords = new WeakMap();
  const attrRecords = new WeakMap();

  let language = 'en';
  try { const saved = localStorage.getItem(KEY); if(SUPPORTED.includes(saved)) language=saved; }
  catch (_) {}

  function translateKey(key) {
    if (language==='en') return key;
    const pair = words[key];
    if(pair) return pair[language];
    const yes=language==='hi'?'हाँ':'होय', no=language==='hi'?'नहीं':'नाही';
    let m;
    if((m=key.match(/^Hey, (.+)$/))) return (language==='hi'?'नमस्ते, ':'नमस्कार, ')+m[1];
    if((m=key.match(/^([\d,]+) Markets$/))) return m[1]+(language==='hi'?' मार्केट':' बाजार');
    if((m=key.match(/^([\d,]+) players$/))) return m[1]+(language==='hi'?' खिलाड़ी':' खेळाडू');
    if((m=key.match(/^([\d,]+) resolved picks$/))) return m[1]+(language==='hi'?' घोषित अनुमान':' निकाल लागलेले अंदाज');
    if((m=key.match(/^([\d,]+) correct picks$/))) return m[1]+(language==='hi'?' सही अनुमान':' बरोबर अंदाज');
    if((m=key.match(/^([\d,]+) community picks( · sample)?$/))) return m[1]+(language==='hi'?' समुदाय के अनुमान':' समुदायाचे अंदाज')+(m[2]?(language==='hi'?' · नमूना':' · नमुना'):'');
    if((m=key.match(/^([\d,]+) days left$/))) return m[1]+(language==='hi'?' दिन बाकी':' दिवस बाकी');
    if((m=key.match(/^([\d,]+) day left$/))) return m[1]+(language==='hi'?' दिन बाकी':' दिवस बाकी');
    if((m=key.match(/^Result: (YES|NO)$/))) return (language==='hi'?'नतीजा: ':'निकाल: ')+(m[1]==='YES'?yes:no);
    if((m=key.match(/^Your pick: (YES|NO)$/))) return (language==='hi'?'आपकी पसंद: ':'तुमची निवड: ')+(m[1]==='YES'?yes:no);
    if((m=key.match(/^(YES|NO) ([\d.]+%)$/))) return (m[1]==='YES'?yes:no)+' '+m[2];
    if((m=key.match(/^([\d,]+) points staked$/))) return m[1]+(language==='hi'?' पॉइंट्स लगाए':' गुण लावले');
    if((m=key.match(/^([\d,]+) points$/))) return m[1]+(language==='hi'?' पॉइंट्स':' गुण');
    if((m=key.match(/^Balance after: ([\d,]+)$/))) return (language==='hi'?'बाद का बैलेंस: ':'नंतरची शिल्लक: ')+m[1];
    if((m=key.match(/^Stake ([\d,]+) points$/))) return (language==='hi'?'लगाएँ ':'लावा ')+m[1]+(language==='hi'?' पॉइंट्स':' गुण');
    if((m=key.match(/^Predictions · ([\d,]+) open$/))) return (language==='hi'?'अनुमान · ':'अंदाज · ')+m[1]+(language==='hi'?' खुले':' सुरू');
    if((m=key.match(/^Provider update: (.+)$/))) return (language==='hi'?'प्रदाता अपडेट: ':'प्रदाता अपडेट: ')+m[1];
    if((m=key.match(/^Over ([\d.]+)$/))) return (language==='hi'?'से ज़्यादा ':'पेक्षा जास्त ')+m[1];
    if((m=key.match(/^Under \/ equal ([\d.]+)$/))) return (language==='hi'?'बराबर या कम ':'एवढे किंवा कमी ')+m[1];
    if((m=key.match(/^(.+) wins$/)) && !key.startsWith('No ')) return m[1]+(language==='hi'?' जीतेगी':' जिंकेल');
    if((m=key.match(/^Confirm (.+) · Stake ([\d,]+) points$/))) return (language==='hi'?'पुष्टि करें: ':'पुष्टी करा: ')+translateKey(m[1])+' · '+m[2]+(language==='hi'?' पॉइंट्स':' गुण');
    if((m=key.match(/^Picked (YES|NO) · ([\d,]+) points staked · (.+)$/))) return (language==='hi'?'चुना ':'निवडले ')+(m[1]==='YES'?yes:no)+' · '+m[2]+(language==='hi'?' पॉइंट्स लगाए · ':' गुण लावले · ')+m[3];
    if((m=key.match(/^Ends (.+)$/))) return (language==='hi'?'समाप्ति: ':'समाप्ती: ')+m[1];
    if((m=key.match(/^Closes (.+)$/))) return (language==='hi'?'बंद: ':'बंद: ')+m[1];
    if((m=key.match(/^Virtual balance: ([\d,]+) points$/))) return (language==='hi'?'वर्चुअल बैलेंस: ':'आभासी शिल्लक: ')+m[1]+(language==='hi'?' पॉइंट्स':' गुण');
    if((m=key.match(/^(\+?[\d,]+) paid$/))) return m[1]+(language==='hi'?' पॉइंट्स मिले':' गुण मिळाले');
    if((m=key.match(/^Source: (.+)$/))) return (language==='hi'?'स्रोत: ':'स्रोत: ')+m[1];
    // Preserve unrecognized text, particularly user-authored questions and settlement rules.
    const match = key.match(/^([↗↘⚙🏏⚽◈♛✓✕◷↩✳●]+)\s+(.+)$/u);
    if(match) {
      const translated = translateKey(match[2]);
      if(translated!==match[2]) return match[1]+' '+translated;
    }
    const trailingArrow=key.match(/^(.+?)\s*[↗→]$/);
    if(trailingArrow) {
      const translated=translateKey(trailingArrow[1].trim());
      if(translated!==trailingArrow[1].trim()) return translated+' ↗';
    }
    if((m=key.match(/^(YES|NO) prediction placed · ([\d,]+) points staked$/))) return (m[1]==='YES'?yes:no)+(language==='hi'?' अनुमान दर्ज · ':' अंदाज नोंदवला · ')+m[2]+(language==='hi'?' पॉइंट्स लगाए':' गुण लावले');
    if((m=key.match(/^(\d+) day left$/))) return m[1]+(language==='hi'?' दिन बाकी':' दिवस बाकी');
    if((m=key.match(/^\d+ open$/)))return key.replace(' open',language==='hi'?' खुले':' सुरू');
    if((m=key.match(/^(.+) · Balance after: ([\d,]+)$/)))return translateKey(m[1])+' · '+(language==='hi'?'बाद का बैलेंस: ':'नंतरची शिल्लक: ')+m[2];
    return key;
  }

  function translateText(node) {
    const parent=node.parentElement;
    if(!parent || parent.closest('script,style,textarea,code,pre,svg,#languageSelect'))return;
    const prev=textRecords.get(node);
    const source=prev && node.nodeValue===prev.output ? prev.source : node.nodeValue;
    const trimmed=source.trim();
    let output=source;
    if(trimmed) {
      const translated=translateKey(trimmed.replace(/\s+/g,' '));
      if(translated!==trimmed.replace(/\s+/g,' ')){
        const leading=(source.match(/^\s*/)||[''])[0];
        const trailing=(source.match(/\s*$/)||[''])[0];
        output=leading+translated+trailing;
      }
    }
    if(output!==node.nodeValue)node.nodeValue=output;
    textRecords.set(node,{source,output});
  }

  function translateAttribute(element, attribute) {
    const val=element.getAttribute(attribute);
    if(val===null)return;
    let record=attrRecords.get(element);
    if(!record){record=Object.create(null);attrRecords.set(element,record);}
    const previous=record[attribute];
    const source=previous && previous.output===val ? previous.source : val;
    const output=translateKey(source);
    if(val!==output)element.setAttribute(attribute,output);
    record[attribute]={source,output};
  }

  function apply() {
    if(!document.body)return;
    document.documentElement.lang=language;
    document.title=TITLES[language];
    const chooser=document.getElementById('languageSelect');
    if(chooser && chooser.value!==language)chooser.value=language;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;while((node=walker.nextNode()))translateText(node);
    document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el=>{
      if(el.closest('#languageSelect'))return;
      for(const attr of ['placeholder','aria-label','title'])if(el.hasAttribute(attr))translateAttribute(el,attr);
    });
  }

  let queued=false;
  function schedule() {
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  }
  function changeLanguage(next) {
    if(!SUPPORTED.includes(next))return;
    language=next;
    try{localStorage.setItem(KEY,next);}catch(_){}
    apply();
    window.dispatchEvent(new CustomEvent('opinzo:language-changed',{detail:{language:next}}));
  }
  window.OPINZO_I18N={
    get language(){return language;},
    get dateLocale(){return LANG_TAG[language];},
    setLanguage:changeLanguage,
    refresh:apply
  };

  function start() {
    const chooser=document.getElementById('languageSelect');
    if(chooser){chooser.value=language;chooser.addEventListener('change',event=>changeLanguage(event.target.value));}
    const observer=new MutationObserver(schedule);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
    apply();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
