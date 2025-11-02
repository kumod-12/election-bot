const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Paths
const RAW_DATA_DIR = path.join(__dirname, '../public/raw-data');
const DATA_DIR = path.join(__dirname, '../public/data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper function to read Excel files
function readExcelFile(filePath, sheetName = null) {
  const workbook = XLSX.readFile(filePath);
  const sheet = sheetName ? workbook.Sheets[sheetName] : workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

// Helper function to read CSV files
function readCSVFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

// Helper function to write JSON files
function writeJSONFile(data, fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Created: ${fileName}`);
}

// Helper function to write CSV files
function writeCSVFile(data, fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, filePath);
  console.log(`✅ Created: ${fileName}`);
}

console.log('🚀 Starting Bihar Election Data Conversion...\n');

try {
  // 1. Process Constituency Region Code CSV
  console.log('📊 Processing constituency region codes...');
  const constRegionData = readCSVFile(path.join(RAW_DATA_DIR, 'const_region_code.csv'));

  const constituencies = constRegionData.map(row => ({
    ac_number: parseInt(row.constcode) - 4000, // Remove state prefix
    ac_name: row.constname,
    state_code: row['State Code'],
    district_number: row.distno,
    region_number: row['Region number'],
    region_code: row['Region code'],
    region_name: row['Regiona Name'],
    held_party: row.heldpty,
    electors: row.electors,
    margin_constituency: row['marg const']
  }));

  writeJSONFile({
    title: "Bihar Assembly Constituencies with Region Mapping",
    total_constituencies: constituencies.length,
    data_source: "Election Commission of India",
    last_updated: new Date().toISOString(),
    constituencies: constituencies
  }, 'bihar-constituencies-master.json');

  // 2. Process Assembly Schedule Excel
  console.log('📅 Processing assembly schedule...');
  const scheduleWorkbook = XLSX.readFile(path.join(RAW_DATA_DIR, 'BIHAR Assembly Schedule_final.xlsx'));
  const scheduleData = XLSX.utils.sheet_to_json(scheduleWorkbook.Sheets['English']);

  if (scheduleData && scheduleData.length > 0) {
    // Extract schedule information
    const phaseData = {};
    const constituencySchedule = [];

    scheduleData.forEach(row => {
      if (row.CONSTCODE && row['PHASE '] && row['Polling date ']) {
        const phase = row['PHASE '].trim();
        const pollingDate = row['Polling date '].trim();
        const countingDate = row['Counting Date'].trim();

        // Track phase data
        if (!phaseData[phase]) {
          phaseData[phase] = {
            phase_name: phase,
            polling_date: pollingDate,
            counting_date: countingDate,
            constituencies: []
          };
        }

        const constituency = {
          constcode: row.CONSTCODE,
          ac_number: parseInt(row.CONSTCODE) - 4000,
          constituency_name: row['Constituency '] ? row['Constituency '].trim() : '',
          official_name: row.__EMPTY || '',
          phase: phase,
          polling_date: pollingDate,
          counting_date: countingDate,
          winner_2020: row[' Winner 2020'] || ''
        };

        phaseData[phase].constituencies.push(constituency);
        constituencySchedule.push(constituency);
      }
    });

    const schedule = {
      election_name: "Bihar Legislative Assembly Election 2025",
      state: "Bihar",
      total_constituencies: constituencySchedule.length,
      phases: Object.values(phaseData).map(phase => ({
        phase_name: phase.phase_name,
        polling_date: phase.polling_date,
        counting_date: phase.counting_date,
        constituencies_count: phase.constituencies.length,
        constituencies: phase.constituencies
      })),
      important_dates: {
        first_phase_polling: "Nov 6, 2025",
        second_phase_polling: "Nov 11, 2025",
        counting_date: "Nov 14, 2025"
      },
      constituency_schedule: constituencySchedule,
      data_source: "Election Commission of India",
      last_updated: new Date().toISOString()
    };

    writeJSONFile(schedule, 'bihar-election-schedule.json');
  }

  // 3. Process Party-wise Performance Data
  console.log('🗳️ Processing party performance data...');
  const workbook2020 = XLSX.readFile(path.join(RAW_DATA_DIR, 'Bihar_Party wise seats and vote share_2010-2015-2020_20250915.xlsx'));

  // Read data from different sheets
  const data2020 = XLSX.utils.sheet_to_json(workbook2020.Sheets['AE_2020']).slice(1); // Skip header row
  const data2015 = XLSX.utils.sheet_to_json(workbook2020.Sheets['AE_2015']).slice(1);
  const data2010 = XLSX.utils.sheet_to_json(workbook2020.Sheets['AE_2010']).slice(1);

  // Create party performance mapping
  const partyMap = {};

  // Process 2020 data
  data2020.forEach(row => {
    if (row.AE_2020 && row.AE_2020 !== 'Party') {
      partyMap[row.AE_2020] = {
        party_name: row.AE_2020,
        performance_2020: {
          seats_contested: row.__EMPTY || 0,
          seats_won: row.__EMPTY_1 || 0,
          votes: row.__EMPTY_2 || 0,
          vote_share: row.__EMPTY_3 || 0
        }
      };
    }
  });

  // Process 2015 data
  data2015.forEach(row => {
    if (row.AE_2015 && row.AE_2015 !== 'Party') {
      if (!partyMap[row.AE_2015]) {
        partyMap[row.AE_2015] = { party_name: row.AE_2015 };
      }
      partyMap[row.AE_2015].performance_2015 = {
        seats_contested: row.__EMPTY || 0,
        seats_won: row.__EMPTY_1 || 0,
        votes: row.__EMPTY_2 || 0,
        vote_share: row.__EMPTY_3 || 0
      };
    }
  });

  // Process 2010 data
  data2010.forEach(row => {
    if (row.AE_2010 && row.AE_2010 !== 'Party') {
      if (!partyMap[row.AE_2010]) {
        partyMap[row.AE_2010] = { party_name: row.AE_2010 };
      }
      partyMap[row.AE_2010].performance_2010 = {
        seats_contested: row.__EMPTY || 0,
        seats_won: row.__EMPTY_1 || 0,
        votes: row.__EMPTY_2 || 0,
        vote_share: row.__EMPTY_3 || 0
      };
    }
  });

  const partyPerformance = {
    title: "Bihar Party-wise Electoral Performance",
    elections: ["2010", "2015", "2020"],
    data_source: "Election Commission of India",
    last_updated: new Date().toISOString(),
    parties: Object.values(partyMap)
  };

  writeJSONFile(partyPerformance, 'bihar-party-performance.json');

  // 4. Process Alliance-wise Data
  console.log('🤝 Processing alliance performance data...');
  const allianceWorkbook = XLSX.readFile(path.join(RAW_DATA_DIR, 'Bihar_Alliance wise seats and vote share_2010-2015-2020_20250915.xlsx'));

  // Read data from different sheets
  const alliance2020 = XLSX.utils.sheet_to_json(allianceWorkbook.Sheets['AE_2020']).slice(1);
  const alliance2015 = XLSX.utils.sheet_to_json(allianceWorkbook.Sheets['AE_2015']).slice(1);
  const alliance2010 = XLSX.utils.sheet_to_json(allianceWorkbook.Sheets['AE_2010']).slice(1);

  const alliancePerformance = {
    title: "Bihar Alliance-wise Electoral Performance",
    elections: ["2010", "2015", "2020"],
    data_source: "Election Commission of India",
    last_updated: new Date().toISOString(),
    regional_analysis: {
      "2020": alliance2020.map(row => ({
        region: row['AE_2020_Vote Share'],
        nda_vote_share: row.__EMPTY || 0,
        mgb_vote_share: row.__EMPTY_1 || 0,
        others_vote_share: row.__EMPTY_2 || 0,
        nda_seats: row.__EMPTY_5 || 0,
        mgb_seats: row.__EMPTY_6 || 0,
        others_seats: row.__EMPTY_7 || 0,
        total_seats: row.__EMPTY_8 || 0
      })),
      "2015": alliance2015.map(row => ({
        region: row['AE_2015_Vote Share'],
        nda_vote_share: row.__EMPTY || 0,
        mgb_vote_share: row.__EMPTY_1 || 0,
        others_vote_share: row.__EMPTY_2 || 0,
        nda_seats: row.__EMPTY_5 || 0,
        mgb_seats: row.__EMPTY_6 || 0,
        others_seats: row.__EMPTY_7 || 0,
        total_seats: row.__EMPTY_8 || 0
      })),
      "2010": alliance2010.map(row => ({
        region: row['AE_2010_Vote Share'],
        nda_vote_share: row.__EMPTY || 0,
        upa_vote_share: row.__EMPTY_1 || 0,
        others_vote_share: row.__EMPTY_2 || 0,
        nda_seats: row.__EMPTY_5 || 0,
        upa_seats: row.__EMPTY_6 || 0,
        others_seats: row.__EMPTY_7 || 0,
        total_seats: row.__EMPTY_8 || 0
      }))
    }
  };

  writeJSONFile(alliancePerformance, 'bihar-alliance-performance.json');

  // 5. Process Turnout Data
  console.log('📈 Processing voter turnout data...');
  const turnoutWorkbook = XLSX.readFile(path.join(RAW_DATA_DIR, 'Bihar_AC wise male-female-total Turnout since 2010_20250915.xlsx'));

  // Read data from different sheets
  const turnout2020 = XLSX.utils.sheet_to_json(turnoutWorkbook.Sheets['AE_2020']);
  const turnout2015 = XLSX.utils.sheet_to_json(turnoutWorkbook.Sheets['AE_2015']);
  const turnout2010 = XLSX.utils.sheet_to_json(turnoutWorkbook.Sheets['AE_2010']);

  // Create constituency turnout mapping
  const turnoutMap = {};

  // Process 2020 data
  turnout2020.forEach(row => {
    if (row.AC_ID) {
      const acNumber = parseInt(row.AC_ID) - 4000; // Remove state prefix
      turnoutMap[acNumber] = {
        ac_number: acNumber,
        ac_name: row.AC_Name,
        ac_type: row.AC_Type,
        turnout_2020: {
          male: row.Male_Turnout || 0,
          female: row.Female_Turnout || 0,
          total: row.Total_Turnout || 0
        }
      };
    }
  });

  // Process 2015 data
  turnout2015.forEach(row => {
    if (row.AC_ID) {
      const acNumber = parseInt(row.AC_ID) - 4000;
      if (!turnoutMap[acNumber]) {
        turnoutMap[acNumber] = {
          ac_number: acNumber,
          ac_name: row.AC_Name,
          ac_type: row.AC_Type
        };
      }
      turnoutMap[acNumber].turnout_2015 = {
        male: row.Male_Turnout || 0,
        female: row.Female_Turnout || 0,
        total: row.Total_Turnout || 0
      };
    }
  });

  // Process 2010 data
  turnout2010.forEach(row => {
    if (row.AC_ID) {
      const acNumber = parseInt(row.AC_ID) - 4000;
      if (!turnoutMap[acNumber]) {
        turnoutMap[acNumber] = {
          ac_number: acNumber,
          ac_name: row.AC_Name,
          ac_type: row.AC_Type
        };
      }
      turnoutMap[acNumber].turnout_2010 = {
        male: row.Male_Turnout || 0,
        female: row.Female_Turnout || 0,
        total: row.Total_Turnout || 0
      };
    }
  });

  const turnoutAnalysis = {
    title: "Bihar Constituency-wise Voter Turnout Analysis",
    elections: ["2010", "2015", "2020"],
    data_source: "Election Commission of India",
    last_updated: new Date().toISOString(),
    constituencies: Object.values(turnoutMap)
  };

  writeJSONFile(turnoutAnalysis, 'bihar-turnout-analysis.json');

  // 6. Process Winner Analysis Data
  console.log('🏆 Processing winner and margin analysis...');
  const winnerWorkbook = XLSX.readFile(path.join(RAW_DATA_DIR, 'Bihar_AC wise winner party_margin_all AE & GE since 2010_20250915.xlsx'));

  // Read data from different election sheets
  const winner2010 = XLSX.utils.sheet_to_json(winnerWorkbook.Sheets['AE_2010']);
  const winner2015 = XLSX.utils.sheet_to_json(winnerWorkbook.Sheets['AE_2015']);
  const winner2020 = XLSX.utils.sheet_to_json(winnerWorkbook.Sheets['AE_2020']);

  // Create constituency winner mapping
  const winnerMap = {};

  // Process 2010 data
  winner2010.forEach(row => {
    if (row.AC_ID) {
      const acNumber = parseInt(row.AC_ID) - 4000; // Remove state prefix
      winnerMap[acNumber] = {
        ac_number: acNumber,
        ac_name: row.AC_Name,
        ac_type: row.AC_Type,
        winner_2010: {
          party: row['Winner party'] || '',
          candidate: row['Winner Candidate'] || '',
          margin: row.Margin || 0,
          margin_percentage: row['Margin (in %)'] || 0
        }
      };
    }
  });

  // Process 2015 data
  winner2015.forEach(row => {
    if (row.AC_ID) {
      const acNumber = parseInt(row.AC_ID) - 4000;
      if (!winnerMap[acNumber]) {
        winnerMap[acNumber] = {
          ac_number: acNumber,
          ac_name: row.AC_Name,
          ac_type: row.AC_Type
        };
      }
      winnerMap[acNumber].winner_2015 = {
        party: row['Winner party'] || '',
        candidate: row['Winner Candidate'] || '',
        margin: row.Margin || 0,
        margin_percentage: row['Margin (in %)'] || 0
      };
    }
  });

  // Process 2020 data
  winner2020.forEach(row => {
    if (row.AC_ID) {
      const acNumber = parseInt(row.AC_ID) - 4000;
      if (!winnerMap[acNumber]) {
        winnerMap[acNumber] = {
          ac_number: acNumber,
          ac_name: row.AC_Name,
          ac_type: row.AC_Type
        };
      }
      winnerMap[acNumber].winner_2020 = {
        party: row['Winner party'] || '',
        candidate: row['Winner Candidate'] || '',
        margin: row.Margin || 0,
        margin_percentage: row['Margin (in %)'] || 0
      };
    }
  });

  const winnerAnalysis = {
    title: "Bihar Constituency-wise Winner and Margin Analysis",
    elections: ["2010", "2015", "2020"],
    data_source: "Election Commission of India",
    last_updated: new Date().toISOString(),
    constituencies: Object.values(winnerMap)
  };

  writeJSONFile(winnerAnalysis, 'bihar-winner-analysis.json');

  // 7. Process Stronghold and Swing Seats
  console.log('🎯 Processing stronghold and swing seats...');
  const strongholdData = readExcelFile(path.join(RAW_DATA_DIR, 'Bihar_AC wise_Stronghold and Swing Seats_20250822 (1).xlsx'));

  if (strongholdData && strongholdData.length > 0) {
    const seatAnalysis = {
      title: "Bihar Stronghold and Swing Seats Analysis",
      data_source: "Election Commission of India",
      last_updated: new Date().toISOString(),
      analysis_period: "2010-2020",
      constituencies: strongholdData.map(row => {
        // Determine stronghold party based on winners
        let strongholdParty = '';
        let swingFactor = 0;
        let competitiveness = 'Medium';

        if (row.Winner_2010 && row.Winner_2015 && row.Winner_2020) {
          const winners = [row.Winner_2010, row.Winner_2015, row.Winner_2020];
          const uniqueWinners = [...new Set(winners)];

          if (uniqueWinners.length === 1) {
            strongholdParty = uniqueWinners[0];
            competitiveness = 'Low';
            swingFactor = 0;
          } else if (uniqueWinners.length === 2) {
            competitiveness = 'Medium';
            swingFactor = 1;
          } else {
            competitiveness = 'High';
            swingFactor = 2;
          }
        }

        return {
          ac_number: row.AC_ID || 0,
          ac_name: row.AC_Name || '',
          ac_type: row.AC_Type || '',
          winner_2010: row.Winner_2010 || '',
          winner_2015: row.Winner_2015 || '',
          winner_2020: row.Winner_2020 || '',
          stronghold_party: strongholdParty,
          swing_factor: swingFactor,
          competitiveness: competitiveness,
          is_swing_seat: row['Swing '] === 'Yes' || swingFactor > 0
        };
      })
    };

    writeJSONFile(seatAnalysis, 'bihar-seat-analysis.json');
  }

  // 8. Process Elector Details
  console.log('👥 Processing elector details...');
  const electorData = readExcelFile(path.join(RAW_DATA_DIR, 'SIR_Pre-Post_Electors_Details_ACs wise_20251028.xlsx'));

  if (electorData && electorData.length > 0) {
    // Filter out the header rows and process the actual data
    const validElectorData = electorData.filter(row =>
      row.AC_ID && typeof row.AC_ID === 'number' && row.AC_Name
    );

    const electorDetails = {
      title: "Bihar Constituency-wise Elector Details",
      data_source: "Election Commission of India",
      last_updated: new Date().toISOString(),
      reference_date: "2025-10-28",
      constituencies: validElectorData.map(row => ({
        ac_number: row.AC_ID || 0,
        ac_name: row.AC_Name || '',
        ac_type: row.AC_Type || '',
        // Post SIR (Special Intensive Revision) - Current Data
        post_sir: {
          male_electors: row.Male_Electors || 0,
          female_electors: row.Female_Electors || 0,
          third_gender_electors: row.TG_Electors || 0,
          service_electors: row.Service_Electors || 0,
          total_electors: row.Total_Electors || 0
        },
        // Pre SIR - Previous Data
        pre_sir: {
          male_electors: row.Male_Electors_1 || 0,
          female_electors: row.Female_Electors_1 || 0,
          third_gender_electors: row.TG_Electors_1 || 0,
          service_electors: row.Service_Electors_1 || 0,
          total_electors: row.Total_Electors_1 || 0
        },
        // Summary for easy access
        total_electors: row.Total_Electors || 0,
        male_electors: row.Male_Electors || 0,
        female_electors: row.Female_Electors || 0,
        third_gender_electors: row.TG_Electors || 0,
        pre_revision_electors: row.Total_Electors_1 || 0,
        post_revision_electors: row.Total_Electors || 0
      }))
    };

    writeJSONFile(electorDetails, 'bihar-elector-details.json');
  }

  // 9. Create Master Election Data combining key information
  console.log('🔄 Creating master election data...');
  const masterElectionData = {
    election: {
      name: "General Election to the Legislative Assembly of Bihar, 2025",
      state: "Bihar",
      country: "India",
      election_commission: "Election Commission of India",
      total_constituencies: 243,
      type: "Legislative Assembly Election"
    },
    schedule: {
      announcement_date: "2025-10-06",
      phases: [
        {
          phase_number: 1,
          constituencies_count: 121,
          polling_date: "2025-11-06",
          polling_day: "Thursday"
        },
        {
          phase_number: 2,
          constituencies_count: 122,
          polling_date: "2025-11-11",
          polling_day: "Tuesday"
        }
      ],
      counting_date: "2025-11-14",
      counting_day: "Friday"
    },
    key_dates: {
      announcement: "2025-10-06",
      first_polling: "2025-11-06",
      second_polling: "2025-11-11",
      vote_counting: "2025-11-14"
    },
    voter_information: {
      total_seats: 243,
      reserved_seats: {
        scheduled_caste: "36 seats (SC category)",
        scheduled_tribe: "2 seats (ST category)",
        general: "205 seats"
      },
      polling_hours: "7:00 AM to 6:00 PM",
      identification_required: true
    },
    data_sources: [
      "bihar-constituencies-master.json",
      "bihar-party-performance.json",
      "bihar-alliance-performance.json",
      "bihar-turnout-analysis.json",
      "bihar-winner-analysis.json",
      "bihar-seat-analysis.json",
      "bihar-elector-details.json"
    ],
    last_updated: new Date().toISOString()
  };

  writeJSONFile(masterElectionData, 'bihar-election-complete.json');

  // 10. Create summary CSV for constituencies
  console.log('📋 Creating constituency summary CSV...');
  const constituencySummary = constituencies.map(constituency => ({
    AC_Number: constituency.ac_number,
    AC_Name: constituency.ac_name,
    Region: constituency.region_name,
    Held_Party: constituency.held_party,
    District_Number: constituency.district_number,
    Total_Electors: constituency.electors
  }));

  writeCSVFile(constituencySummary, 'bihar-constituencies-summary.csv');

  console.log('\n✅ Data conversion completed successfully!');
  console.log('\n📁 Generated Files:');
  console.log('   • bihar-election-complete.json (Master election data)');
  console.log('   • bihar-constituencies-master.json (Constituency details)');
  console.log('   • bihar-party-performance.json (Party-wise performance)');
  console.log('   • bihar-alliance-performance.json (Alliance performance)');
  console.log('   • bihar-turnout-analysis.json (Voter turnout data)');
  console.log('   • bihar-winner-analysis.json (Winner and margin analysis)');
  console.log('   • bihar-seat-analysis.json (Stronghold/swing seats)');
  console.log('   • bihar-elector-details.json (Elector demographics)');
  console.log('   • bihar-constituencies-summary.csv (Summary CSV)');

} catch (error) {
  console.error('❌ Error during data conversion:', error.message);
  console.error(error.stack);
}

// Remove old data files
console.log('\n🗑️ Cleaning up old data files...');
const oldFiles = [
  'election-info.json',
  'bihar-election-2025-complete.json',
  'bihar-constituencies-phase1.csv',
  'bihar-constituencies-phase2.csv'
];

oldFiles.forEach(fileName => {
  const filePath = path.join(DATA_DIR, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Removed: ${fileName}`);
  }
});

console.log('\n🎉 All done! Your Bihar election data has been converted and structured.');