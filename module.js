const Facebook = require('./lib/config');
const axios = require('axios');
const fs = require('fs');
const md5 = require('js-md5');
const cheerio = require('cheerio');

Facebook.prototype.login = async function(dataLogin, path = ''){

	if (dataLogin.user !== undefined && dataLogin.pass !== undefined) {

		await this.getTokenCookie(dataLogin.user, dataLogin.pass);
		await this.getFBdtsg();
		if (path !== '') {
			this.saveFile(path);
		}
		return true;
	}

	return false;
	
};


Facebook.prototype.postStatus = async function(content, privacy = 0){
	var listPrivacy = [300645083384735, 291667064279714, 286958161406148];
	this.url = 'https://m.facebook.com/a/home.php';
	this.formData = {
		privacyx: listPrivacy[privacy],
		xc_message: content,
		target: this.dataRequest.user_id,
		__a: 1,
		fb_dtsg: this.dataRequest.fb_dtsg
	};


	if (content == '') {
		return false;
	}

	return await this.run();

};



Facebook.prototype.reactPost = async function(idPost, type = 'like'){
	var typeReaction = {
		like: 1,
		love: 2,
		wow: 3,
		haha: 4,
		sad: 7,
		angry: 8
	};

	this.url = 'https://www.facebook.com/ufi/reaction';
	this.formData = {
		ft_ent_identifier: idPost,
		reaction_type: typeReaction[type],
		client_id: '1',
		source: '1',
		fb_dtsg: this.dataRequest.fb_dtsg
	};



	return await this.run();

};

Facebook.prototype.commentPost = async function(idPost, content, sticker = 0){
	var dataSticker = ["", "126361874215276", "126362187548578", "126361967548600", "126362100881920", "126362137548583", "126361920881938", 
	"126362064215257", "126361974215266", "126361910881939", "126361987548598", "126361994215264", "126362007548596", "126362027548594", "126362044215259", 
	"126362074215256", "126362080881922", "126362087548588", "126362107548586", "126362117548585", "126362124215251", "126362130881917", "126362160881914", 
	"126362167548580", "126362180881912", "126362197548577", "126362207548576", "126361900881940", "126361884215275", "126361957548601", "126361890881941", 
	"126362034215260", "126362230881907"];

	this.url = 'https://www.facebook.com/ufi/add/comment/';
	this.formData = {
		ft_ent_identifier: idPost,
		comment_text: content,
		attached_sticker_fbid: dataSticker[sticker],
		source: 1,
		client_id: 1,
		__a: 1,
		fb_dtsg: this.dataRequest.fb_dtsg
	};

	var data = await this.run();
	data = JSON.parse(data.substr(9));
	var dataReturn = data.jsmods;

	if (typeof dataReturn.require[1][3][1] === 'object') {
		dataReturn = dataReturn.require[1][3][1].comments[0].id;
	}else{
		dataReturn = dataReturn.require[2][3][1].comments[0].id;
	}

	return dataReturn;
};

Facebook.prototype.run = async function(type = 'post', typeConfig = 'cookie'){
	this.config.url = this.url;

	if (type === 'get') {
		this.config.method = 'get';
		this.config.data = '';
	}else{
		this.config.method = 'post';
		this.config.data = this.formData;

	}

	if (typeConfig === 'cookie') {
		this.headers.cookie.cookie = this.dataRequest.cookie;
		this.config.headers = this.headers.cookie;
	}else{
		this.config.headers = this.headers.token;
	}

	var dataReturn = await axios(this.config);
	return dataReturn.data;
};




Facebook.prototype.getTokenCookie = async function(email, pass){
	this.url = 'https://b-api.facebook.com/method/auth.login';
	this.formData = {
		api_key: '882a8490361da98702bf97a021ddc14d',
		client_country_code: 'VN',
		cpl: 'true',
		credentials_type: 'device_based_login_password',
		currently_logged_in_userid: '0',
		email: email,
		error_detail_type: 'button_with_disabled',
		fb_api_caller_class: 'com.facebook.account.login.protocol.Fb4aAuthHandler',
		fb_api_req_friendly_name: 'authenticate',
		format: 'json',
		generate_session_cookies: '1',
		locale: 'vi_VN',
		meta_inf_fbmeta: '',
		method: 'auth.login',
		password: pass,
		source: 'device_based_login',		
	};
	this.formData.sig = this.getSig(this.formData);

	var dataFb = await this.run('post', 'token');

	if (dataFb.error_code) {
		return false;
	}else{
		var data =  dataFb.session_cookies.map(function(item){
			return item.name +'='+ item.value;
		});

		var resuft = {
			cookie: data.join('; '),
			access_token: dataFb.access_token
		};
		this.dataRequest = resuft;
		return resuft;
	}

};

Facebook.prototype.getFBdtsg = async function(){
	this.url = 'https://m.facebook.com/';
	var data = await this.run('get');
	var $ = cheerio.load(data);
	var fb_dtsg = $('input[name="fb_dtsg"]').val();
	this.dataRequest.fb_dtsg = fb_dtsg;
	return fb_dtsg;

};


Facebook.prototype.setData = function(dataFb){
	this.dataRequest = dataFb;
};

Facebook.prototype.getSig = function(formData) {
	var sig = '';
	Object.keys(formData).forEach(function(key) {
		sig += key +'='+ formData[key];
	});
	sig = md5(sig + '62f8ce9f74b12f84c123cc23437a4a32');
	return sig;
};


Facebook.prototype.saveFile = function(path){
	var dataSave = {
		cookie: this.dataRequest.cookie,
		fb_dtsg: this.dataRequest.fb_dtsg,
		access_token: this.dataRequest.access_token
	};
	fs.writeFile(path, JSON.stringify(dataSave), function(){
		console.log('Save File Success');
	})
};


Facebook.prototype.readFile = function(path) {
	// body...
};


module.exports = Facebook;