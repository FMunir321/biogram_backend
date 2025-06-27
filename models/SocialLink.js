const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  platform: {
    type: String,
    required: true,
    enum: [
      'instagram','snapchat','facebook','twitter','discord','youtube','tiktok','reddit',
      'linkedin','skype','telegram','whatsapp','calendly','github','minnect','opentable',
      'spotify','apple-music','soundcloud','youtube-music','audiomack','tidal','deezer','amazon-music',
      'paypal','venmo','cashapp','zelle',
      'twitch','playstation','xbox','steam','kick','apple-podcasts',
      'pinterest','vsco','depop','onlyfans','yelp','opensea','cameo','patreon'
    ]
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?(www\.)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  }
});

module.exports = mongoose.model('SocialLink', socialLinkSchema);