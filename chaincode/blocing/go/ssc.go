 package main

 /* Imports
  * 4 utility libraries for formatting, handling bytes, reading and writing JSON, and string manipulation
  * 2 specific Hyperledger Fabric specific libraries for Smart Contracts
  */
 import (
	 "encoding/json"
	 "fmt"

	 "github.com/hyperledger/fabric/core/chaincode/shim"
	 sc "github.com/hyperledger/fabric/protos/peer"
 )
 
 // Define the Smart Contract structure
 type SmartContract struct {
 }
 
 // Define the car structure, with 4 properties.  Structure tags are used by encoding/json library
 type Card struct {
	 Card_did   string `json:"card_did"`
	 Holder_id  string `json:"holder_id"`
	 Issuer_id string `json:"issuer_id"`
	 Update_date  string `json:"update_date"`
 }
 type Attendance struct {
	 Attendance_id string `json:"attenance_id`
	 Class_id string `json:"class_id`
	 Holder_id string `json:holder_id`
	 Status string `json:status`
	 Time string `json:time`
	 Verifier_id string `json:verifier_id`
 }

 /*
  * The Init method is called when the Smart Contract "fabcar" is instantiated by the blockchain network
  * Best practice is to have any Ledger initialization in separate function -- see initLedger()
  */
 func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	 return shim.Success([]byte("Init process was done."))
 }
 
 /*
  * The Invoke method is called as a result of an application request to run the Smart Contract "fabcar"
  * The calling application program has also specified the particular smart contract function to be called, with arguments
  */
 func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {
 
	 // Retrieve the requested Smart Contract function and arguments
	 function, args := APIstub.GetFunctionAndParameters()
	 var result string
	 var err error
	 // Route to the appropriate handler function to interact with the ledger appropriately
	 if function == "getCard" {
		 result,err = getCard(APIstub, args)
	 } else if function == "initLedger" {
		return s.initLedger(APIstub)
	 } else if function == "setCard" {
		 result,err = setCard(APIstub, args)
	 } else if function == "updateCard" {
		 result,err = updateCard(APIstub, args)
	 } else if function == "setAttendance" {
		result,err = setAttendance(APIstub, args)
	 } else if function == "getAttendance" {
		result,err = getAttendance(APIstub, args)
	 } else {
		 return shim.Error(err.Error())
	 }
	 if err != nil {
		 return shim.Error(err.Error())
	 }
 
	 return shim.Success([]byte(result))
 }

 
 func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	 cards := []Card{
		 Card{Card_did: "did:sov:75epRGLms479RezAmgmLn3", Holder_id: "1", Issuer_id: "0", Update_date: "2020-10-24 21:52:57"},
		 Card{Card_did: "did:sov:MM1AqQa2TiPmNkDKhNVc9n", Holder_id: "6", Issuer_id: "0", Update_date: "2020-10-25 12:51:42"},
		 Card{Card_did: "did:sov:37NaIw2L5NidmBKKhhn7Cs", Holder_id: "2", Issuer_id: "0", Update_date: "2020-10-26 17:42:57"},
		 Card{Card_did: "did:sov:13UYBbpkm59872vdYnKv2N", Holder_id: "3", Issuer_id: "0", Update_date: "2020-11-12 13:11:27"},
		}
		
		i := 0
		for i < len(cards) {
			fmt.Println("i is ", i)
			cardAsBytes, _ := json.Marshal(cards[i])
			APIstub.PutState(cards[i].Card_did, cardAsBytes)
			fmt.Println("Added", cards[i])
			i = i + 1
		}
		
		return shim.Success(nil)
}
	
func setCard(APIstub shim.ChaincodeStubInterface, args []string) (string, error) {
		
	if len(args) != 4 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key and a value")
	}
		
	fmt.Printf("========== setCard START ==========")
	fmt.Printf("set PutState:" +args[0]+args[1]+args[2]+args[3])
	
	var card = Card{Card_did: args[0], Holder_id: args[1], Issuer_id: args[2], Update_date: args[3]}
	cardAsBytes, _ := json.Marshal(card)
	err := APIstub.PutState(args[0], cardAsBytes)
	
	if err != nil {
		return "", fmt.Errorf(fmt.Sprintf("Failed to create card: %s", args[0]))
	}
	return args[0], nil
}
	
func getCard(APIstub shim.ChaincodeStubInterface, args []string) (string, error) {

	if len(args) != 1 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key")
	}

	value, err := APIstub.GetState(args[0])

	if err != nil {
		return "", fmt.Errorf("Failed to get card: %s with error: %s", args[0], err)
	}
  
	if value == nil {
		return "", fmt.Errorf("Card not found: %s", args[0])
	}
  
	 return string(value), nil
}
	
func updateCard(APIstub shim.ChaincodeStubInterface, args []string) (string, error) {
	
	if len(args) != 2 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key and a value")
	}

	fmt.Println("get GetState: " + args[0]+args[1])

	value, err := APIstub.GetState(args[0])

	if err != nil { // GetState 함수가 오류 난 경우

		return "", fmt.Errorf(fmt.Sprintf("Failed to get Card: %s", args[0]), err)
  
	 }
  
	 if value == nil { // key에 대한 값을 찾을 수 없는 경우
  
		return "", fmt.Errorf("Card not found: %s", args[0])
  
	 }

	card := Card{}

	json.Unmarshal(value, &card)
	fmt.Print("updateCard:" + card.Update_date+ ":" + args[1])
	card.Update_date = args[1]

	cardAsBytes, _ := json.Marshal(card)
	err = APIstub.PutState(args[0], cardAsBytes)

	if err != nil {

		return "", fmt.Errorf("Failed to set card: %s", args[0])
  
	 }
  
	 return string(cardAsBytes), nil
}
 
func setAttendance(APIstub shim.ChaincodeStubInterface, args []string) (string, error) {
	// attendance_id, class_id, holder_id, status, time, verifier_id
	if len(args) != 6 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key and a value")
	}

	value, err := APIstub.GetState("holder:"+args[2]+"class:"+args[1])
	
	if err != nil { // GetState 함수가 오류 난 경우

		return "", fmt.Errorf(fmt.Sprintf("Failed to get Card: %s", args[0]), err)
  
	 }

	 if value == nil { // key에 대한 값을 찾을 수 없는 경우
		attendance := Attendance{Attendance_id: args[0], Class_id: args[1], Holder_id: args[2], Status: args[3], Time: args[4], Verifier_id: args[5]}
	
		attendAsBytes, _ := json.Marshal(attendance)
		err = APIstub.PutState("holder:"+args[2]+"class:"+args[1], attendAsBytes)
		
		if err != nil {
			return "", fmt.Errorf(fmt.Sprintf("Failed to create card: %s", "holder:"+args[2]+"class:"+args[1]))
		}
		return string("holder:"+args[2]+"class:"+args[1]), nil

	 } else {
		attendance := Attendance{}
		json.Unmarshal(value, &attendance)

		// attendance_id, class_id, holder_id, status, time, verifier_id
		attendance.Attendance_id = args[0]
		attendance.Status= args[3]
		attendance.Time= args[4]
		attendance.Verifier_id=args[5]

		attendAsBytes, _ := json.Marshal(attendance)
		err = APIstub.PutState("holder:"+args[2]+"class:"+args[1], attendAsBytes)
		
		if err != nil {
			return "", fmt.Errorf(fmt.Sprintf("Failed to create card: %s", args[0]))
		}
		return string(attendAsBytes), nil
	 }
}

func getAttendance(APIstub shim.ChaincodeStubInterface, args []string) (string, error) {
	//holder_id, class_id
	if len(args) != 2 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key")
	}

	value, err := APIstub.GetState("holder:"+args[0]+"class:"+args[1])

	if err != nil {
		return "", fmt.Errorf("Failed to get card: %s with error: %s", args[0], err)
	}
  
	if value == nil {
		return "", fmt.Errorf("Card not found: %s", args[0])
	}
  
	 return string(value), nil
}

 // The main function is only relevant in unit test mode. Only included here for completeness.
 func main() {
 
	 // Create a new Smart Contract
	 if err := shim.Start(new(SmartContract)); err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	 }
 }
 