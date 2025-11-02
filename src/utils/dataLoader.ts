import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ElectionData {
  [key: string]: any;
}

export class DataLoader {
  private static instance: DataLoader;
  private loadedData: ElectionData = {};

  private constructor() {}

  public static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  public async loadAllData(): Promise<ElectionData> {
    try {
      // Load new structured Bihar election data files
      const filesToLoad = [
        { path: '/data/bihar-election-complete.json', type: 'json' },
        { path: '/data/bihar-constituencies-master.json', type: 'json' },
        { path: '/data/bihar-party-performance.json', type: 'json' },
        { path: '/data/bihar-alliance-performance.json', type: 'json' },
        { path: '/data/bihar-turnout-analysis.json', type: 'json' },
        { path: '/data/bihar-winner-analysis.json', type: 'json' },
        { path: '/data/bihar-seat-analysis.json', type: 'json' },
        { path: '/data/bihar-elector-details.json', type: 'json' },
        { path: '/data/bihar-constituencies-summary.csv', type: 'csv' }
      ];

      const loadedFiles: any = {};
      const loadedTypes: string[] = [];

      // Try to load each file
      for (const file of filesToLoad) {
        try {
          if (file.type === 'json') {
            const data = await this.loadJSONFile(file.path);
            if (Object.keys(data).length > 0) {
              const fileName = file.path.split('/').pop()?.replace('.json', '') || 'unknown';
              loadedFiles[fileName] = data;
              loadedTypes.push('JSON');
            }
          } else if (file.type === 'csv') {
            const data = await this.loadCSVFile(file.path);
            if (data.length > 0) {
              const fileName = file.path.split('/').pop()?.replace('.csv', '') || 'unknown';
              loadedFiles[fileName] = data;
              loadedTypes.push('CSV');
            }
          }
        } catch (error) {
          console.warn(`Failed to load ${file.path}:`, error);
        }
      }

      this.loadedData = {
        ...loadedFiles,
        loadedAt: new Date().toISOString(),
        dataTypes: Array.from(new Set(loadedTypes)) // Remove duplicates
      };

      // If we have data, great! Otherwise, use default
      if (Object.keys(loadedFiles).length > 0) {
        console.log('Successfully loaded election data:', this.loadedData);
        return this.loadedData;
      } else {
        console.warn('No election data files found, using default data');
        return this.getDefaultData();
      }
    } catch (error) {
      console.error('Error loading election data:', error);
      return this.getDefaultData();
    }
  }

  private async loadJSONFile(filePath: string): Promise<any> {
    try {
      // Since we can't directly read files from src/data in a React app,
      // we'll need to move files to public folder or embed them
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Could not load JSON file ${filePath}:`, error);
      return {};
    }
  }

  private async loadCSVFile(filePath: string): Promise<any[]> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}`);
      }
      const csvText = await response.text();

      return new Promise((resolve) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data as any[]);
          },
          error: (error: any) => {
            console.warn(`Error parsing CSV ${filePath}:`, error);
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.warn(`Could not load CSV file ${filePath}:`, error);
      return [];
    }
  }

  private async loadExcelFile(filePath: string): Promise<any> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      const result: any = {};
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        result[sheetName] = XLSX.utils.sheet_to_json(worksheet);
      });

      return result;
    } catch (error) {
      console.warn(`Could not load Excel file ${filePath}:`, error);
      return {};
    }
  }

  private async loadImageFile(filePath: string): Promise<string> {
    try {
      // For images, we'll return the path for display
      return filePath;
    } catch (error) {
      console.warn(`Could not load image file ${filePath}:`, error);
      return '';
    }
  }

  private getDefaultData(): ElectionData {
    return {
      election: {
        name: "Sample Election",
        date: "2024-11-05",
        type: "General Election"
      },
      message: "No external election data loaded. Using default sample data.",
      dataTypes: ['Default']
    };
  }

  public getLoadedData(): ElectionData {
    return this.loadedData;
  }

  public formatDataForAI(): string {
    if (!this.loadedData || Object.keys(this.loadedData).length === 0) {
      return "No specific election data available.";
    }

    let formatted = "BIHAR ELECTION DATA 2025:\n\n";

    // Handle main election information
    const electionComplete = this.loadedData['bihar-election-complete'];
    if (electionComplete) {
      if (electionComplete.election) {
        formatted += `Election: ${electionComplete.election.name}\n`;
        formatted += `State: ${electionComplete.election.state}\n`;
        formatted += `Total Constituencies: ${electionComplete.election.total_constituencies}\n`;
        formatted += `Type: ${electionComplete.election.type}\n`;
      }

      if (electionComplete.schedule) {
        formatted += "\nElection Schedule:\n";
        formatted += `Announcement Date: ${electionComplete.schedule.announcement_date}\n`;

        electionComplete.schedule.phases.forEach((phase: any) => {
          formatted += `Phase ${phase.phase_number}: ${phase.polling_date} (${phase.polling_day}) - ${phase.constituencies_count} constituencies\n`;
        });

        formatted += `Vote Counting: ${electionComplete.schedule.counting_date} (${electionComplete.schedule.counting_day})\n`;
      }

      if (electionComplete.voter_information) {
        formatted += "\nVoter Information:\n";
        formatted += `Total Seats: ${electionComplete.voter_information.total_seats}\n`;
        formatted += `Polling Hours: ${electionComplete.voter_information.polling_hours}\n`;
        formatted += `ID Required: ${electionComplete.voter_information.identification_required ? 'Yes' : 'No'}\n`;
        if (electionComplete.voter_information.reserved_seats) {
          formatted += `Reserved Seats - SC: ${electionComplete.voter_information.reserved_seats.scheduled_caste}\n`;
          formatted += `Reserved Seats - ST: ${electionComplete.voter_information.reserved_seats.scheduled_tribe}\n`;
          formatted += `General Seats: ${electionComplete.voter_information.reserved_seats.general}\n`;
        }
      }
      formatted += "\n";
    }

    // Handle constituency master data
    const constituenciesMaster = this.loadedData['bihar-constituencies-master'];
    if (constituenciesMaster && constituenciesMaster.constituencies) {
      formatted += "CONSTITUENCY INFORMATION:\n";
      formatted += `Total Constituencies: ${constituenciesMaster.total_constituencies}\n\n`;

      // Group by region for better organization
      const regionGroups: { [key: string]: any[] } = {};
      constituenciesMaster.constituencies.forEach((constituency: any) => {
        const region = constituency.region_name || 'Unknown';
        if (!regionGroups[region]) {
          regionGroups[region] = [];
        }
        regionGroups[region].push(constituency);
      });

      Object.entries(regionGroups).forEach(([region, constituencies]) => {
        formatted += `${region} Region (${constituencies.length} constituencies):\n`;
        constituencies.slice(0, 10).forEach((constituency: any) => {
          formatted += `  AC-${constituency.ac_number}: ${constituency.ac_name} (Currently held by: ${constituency.held_party})\n`;
        });
        if (constituencies.length > 10) {
          formatted += `  ... and ${constituencies.length - 10} more constituencies\n`;
        }
        formatted += "\n";
      });
    }

    // Handle party performance data
    const partyPerformance = this.loadedData['bihar-party-performance'];
    if (partyPerformance && partyPerformance.parties) {
      formatted += "PARTY PERFORMANCE (2010-2020):\n";
      partyPerformance.parties.slice(0, 8).forEach((party: any) => {
        if (party.party_name && party.party_name !== 'Total' && party.party_name !== 'OTH') {
          formatted += `${party.party_name}:\n`;
          formatted += `  2020: ${party.performance_2020?.seats_won || 0} seats won (${Number(party.performance_2020?.vote_share || 0).toFixed(1)}% votes)\n`;
          formatted += `  2015: ${party.performance_2015?.seats_won || 0} seats won (${Number(party.performance_2015?.vote_share || 0).toFixed(1)}% votes)\n`;
          formatted += `  2010: ${party.performance_2010?.seats_won || 0} seats won (${Number(party.performance_2010?.vote_share || 0).toFixed(1)}% votes)\n`;
        }
      });
      formatted += "\n";
    }

    // Handle alliance performance data
    const alliancePerformance = this.loadedData['bihar-alliance-performance'];
    if (alliancePerformance && alliancePerformance.regional_analysis) {
      formatted += "ALLIANCE PERFORMANCE BY REGION:\n";

      // Show 2020 regional performance
      if (alliancePerformance.regional_analysis['2020']) {
        formatted += "2020 Election - Regional Breakdown:\n";
        alliancePerformance.regional_analysis['2020'].slice(0, 6).forEach((region: any) => {
          if (region.region && region.region !== 'Region New') {
            formatted += `  ${region.region}: NDA ${region.nda_seats} seats (${Number(region.nda_vote_share || 0).toFixed(1)}%), MGB ${region.mgb_seats} seats (${Number(region.mgb_vote_share || 0).toFixed(1)}%)\n`;
          }
        });
      }
      formatted += "\n";
    }

    // Handle seat analysis
    const seatAnalysis = this.loadedData['bihar-seat-analysis'];
    if (seatAnalysis && seatAnalysis.constituencies) {
      const strongholdSeats = seatAnalysis.constituencies.filter((seat: any) =>
        seat.seat_type && seat.seat_type.toLowerCase().includes('stronghold')
      );
      const swingSeats = seatAnalysis.constituencies.filter((seat: any) =>
        seat.seat_type && seat.seat_type.toLowerCase().includes('swing')
      );

      formatted += "SEAT ANALYSIS:\n";
      formatted += `Stronghold Seats: ${strongholdSeats.length}\n`;
      formatted += `Swing Seats: ${swingSeats.length}\n`;

      if (strongholdSeats.length > 0) {
        formatted += "\nKey Stronghold Seats:\n";
        strongholdSeats.slice(0, 5).forEach((seat: any) => {
          formatted += `  ${seat.ac_name}: ${seat.stronghold_party} stronghold\n`;
        });
      }

      if (swingSeats.length > 0) {
        formatted += "\nKey Swing Seats to Watch:\n";
        swingSeats.slice(0, 5).forEach((seat: any) => {
          formatted += `  ${seat.ac_name}: ${seat.competitiveness} competitiveness\n`;
        });
      }
      formatted += "\n";
    }

    // Handle constituency summary CSV data
    const constituencySummary = this.loadedData['bihar-constituencies-summary'];
    if (constituencySummary && Array.isArray(constituencySummary)) {
      const partyHoldings: { [key: string]: number } = {};

      constituencySummary.forEach((constituency: any) => {
        const party = constituency.Held_Party || 'Unknown';
        partyHoldings[party] = (partyHoldings[party] || 0) + 1;
      });

      formatted += "CURRENT SEAT DISTRIBUTION:\n";
      Object.entries(partyHoldings)
        .sort(([,a], [,b]) => b - a)
        .forEach(([party, count]) => {
          formatted += `${party}: ${count} seats\n`;
        });
      formatted += "\n";
    }

    // Add metadata
    if (this.loadedData.dataTypes) {
      formatted += `Data Sources: ${this.loadedData.dataTypes.join(', ')}\n`;
    }
    if (this.loadedData.loadedAt) {
      formatted += `Data Last Loaded: ${this.loadedData.loadedAt}\n`;
    }

    return formatted;
  }
}

export default DataLoader;