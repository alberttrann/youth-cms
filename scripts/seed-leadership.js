const fs = require('fs');
const path = require('path');

// Parse leadership data từ file text đã lấy từ Google Docs
const leadershipData = {
  executives: [
    {
      name: 'Theodora Abena Yeboah',
      role: 'Vice President - Chair',
      leadershipType: 'executive',
      displayOrder: 1,
      continent: 'Africa',
      bio: 'Founder of Education Hub Ghana. Passionate about SDGs, especially SDG3 and SDG4. Leadership as a tool for meaningful change and youth empowerment.',
      focusSdgs: ['3', '4'],
      year: '2026 - 2027',
      socialLinks: [
        { platform: 'linkedin', url: 'https://www.linkedin.com/in/theodoraayeboah?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app' }
      ]
    },
    {
      name: 'Safin Hussein Mohammed',
      role: 'President - Chair',
      leadershipType: 'executive',
      displayOrder: 2,
      continent: 'Africa',
      bio: 'Founder of Youth Global Network. Leadership is about creating opportunities for others to grow. Empowering young people and advancing SDGs.',
      focusSdgs: ['4', '8', '17'],
      year: '2026 - 2027',
      socialLinks: [
        { platform: 'linkedin', url: 'https://www.linkedin.com/in/safeen-mohammed-83223153' },
        { platform: 'instagram', url: 'https://www.instagram.com/safee.n?igsh=MWp4M3QwMWcxNGo1bg%3D%3D&utm_source=qr' },
        { platform: 'facebook', url: 'https://www.facebook.com/share/1Ct5WH6pwk/?mibextid=wwXIfr' }
      ]
    },
    {
      name: 'Thuy Linh Nguyen T. (Emily)',
      role: 'Vice President - Chair',
      leadershipType: 'executive',
      displayOrder: 3,
      continent: 'Asia',
      bio: 'Founder of CSE Global. Empowering young people to tackle global challenges. Meaningful impact begins locally then expands globally.',
      focusSdgs: ['4', '5', '17'],
      year: '2026 - 2027',
      socialLinks: [
        { platform: 'linkedin', url: 'https://www.linkedin.com/in/emily-linhnguyen/' }
      ]
    }
  ],
  directors: [
    {
      name: 'Trần Nguyễn Mai Trinh',
      role: 'Regional Director - Ho Chi Minh City',
      leadershipType: 'continental-director',
      displayOrder: 4,
      continent: 'Asia',
      regionGroup: 'Southeast Asia',
      bio: 'Experience in AIESEC, Sở Ngoại vụ TP.HCM, and Korea Trade-Investment Promotion Agency. Focus on protecting vulnerable groups and non-traditional security.',
      focusSdgs: ['5', '10', '16'],
      year: '2026',
      socialLinks: [
        { platform: 'linkedin', url: 'https://www.linkedin.com/in/maitrinhtrannguyen/' }
      ]
    },
    {
      name: 'Lê Mạnh Linh (Henry)',
      role: 'Regional Director - Hanoi',
      leadershipType: 'continental-director',
      displayOrder: 5,
      continent: 'Asia',
      regionGroup: 'Southeast Asia',
      bio: 'Senior student at Hanoi National University of Education. 4 years of Youth Union activities. Believes in volunteerism and community contribution.',
      focusSdgs: ['4', '5', '11'],
      year: '2026'
    },
    {
      name: 'Nguyễn Thanh Hải (Hai)',
      role: 'Regional Director - Ho Chi Minh City',
      leadershipType: 'continental-director',
      displayOrder: 6,
      continent: 'Asia',
      regionGroup: 'Southeast Asia',
      bio: 'International Relations student at UEF. Quick thinker with good teamwork and time management. Focused on SDG 4 and positive social impact.',
      focusSdgs: ['4'],
      year: '2026'
    },
    {
      name: 'Trần Thị Mỹ Phúc (ER)',
      role: 'Regional Director - Ho Chi Minh City',
      leadershipType: 'continental-director',
      displayOrder: 7,
      continent: 'Asia',
      regionGroup: 'Southeast Asia',
      bio: 'Student at University of Economics Ho Chi Minh City. Passionate about sustainable development. CSE as bridge connecting like-minded individuals.',
      focusSdgs: ['4', '11', '12'],
      year: '2026',
      socialLinks: [
        { platform: 'linkedin', url: 'https://www.linkedin.com/in/phúc-trần-thị-mỹ-317b13402?utm_source=share_via&utm_content=profile&utm_medium=member_android' }
      ]
    },
    {
      name: 'Vũ Huyền (Huyen)',
      role: 'Regional Director - Hanoi',
      leadershipType: 'continental-director',
      displayOrder: 8,
      continent: 'Asia',
      regionGroup: 'Southeast Asia',
      bio: 'Education student. Passionate about SDG4 and SDG5. Education as key to equality where everyone can thrive.',
      focusSdgs: ['4', '5'],
      year: '2026'
    },
    {
      name: 'Nguyễn Thái (Vladimir Thai / Alpha)',
      role: 'Regional Director - Hanoi',
      leadershipType: 'continental-director',
      displayOrder: 9,
      continent: 'Asia',
      regionGroup: 'Southeast Asia',
      bio: 'International Economics student at NEU. Passionate about global markets and sustainable development. Focus on clean water, education, and healthy environment.',
      focusSdgs: ['3', '4', '7'],
      year: '2026'
    }
  ]
};

module.exports = { leadershipData };
